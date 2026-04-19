import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '@src/core/prisma/prisma.service';
import {
  SetPlayerRiotReqDto,
  SetPlayerSettingReqDto,
  TryLoginPlayerReqDto,
} from './dto/set-player-setting/request.dto';
import { CustomException } from '@src/common/exception/exceptions';
import axios from 'axios';

/** bcrypt cost factor (10 ≈ ~100ms per hash on typical server CPU) */
const BCRYPT_SALT_ROUNDS = 10;

const ACCESS_JWT_EXPIRES_IN = '1h' as const;
const REFRESH_JWT_EXPIRES_IN = '1d' as const;

@Injectable()
export class PlayerSettingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  private async assertLoginIdAvailable(loginId: string): Promise<void> {
    const existing = await this.prisma.player.findFirst({
      where: { loginId, deletedAt: null },
    });
    if (existing) {
      // throw new ConflictException('이미 존재하는 플레이어입니다.');
      throw new CustomException('player.duplicate', 'BAD_REQUEST', { field: 'loginId', fieldMessage: 'player.duplicate' });
    }
  }

  private async assertNicknameAvailable(nickname: string): Promise<void> {
    const existing = await this.prisma.player.findFirst({
      where: { nickName: nickname, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('이미 존재하는 닉네임입니다.');
    }
  }

  async setPlayer(dto: SetPlayerSettingReqDto) {
    try {
      await this.assertLoginIdAvailable(dto.loginId);
      await this.assertNicknameAvailable(dto.nickName);

      const passwordHash = await bcrypt.hash(
        dto.password,
        BCRYPT_SALT_ROUNDS,
      );

      await this.prisma.player.create({
        data: {
          loginId: dto.loginId,
          nickName: dto.nickName,
          password: passwordHash,
        },
      });

      return 'set player success'
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException('common.errorMessage', 'INTERNAL_SERVER_ERROR');
    }
  }

  async tryLoginPlayer(dto: TryLoginPlayerReqDto) {
    try {
      const player = await this.prisma.player.findFirst({
        where: { loginId: dto.loginId, deletedAt: null },
        select: { id: true, password: true, isActive: true },
      });

      const passwordOk =
        player &&
        player.isActive &&
        (await bcrypt.compare(dto.password, player.password));

      if (!passwordOk) {
        throw new CustomException('player.loginInvalid', 'UNAUTHORIZED', {
          field: 'loginId',
          fieldMessage: 'player.loginInvalid',
        });
      }

      const session = randomUUID();
      const payloadBase = {
        sub: player.id,
        typ: 'player' as const,
        session,
      };

      const accessToken = await this.jwtService.signAsync(
        { ...payloadBase, kind: 'access' as const },
        { expiresIn: ACCESS_JWT_EXPIRES_IN },
      );
      const refreshToken = await this.jwtService.signAsync(
        { ...payloadBase, kind: 'refresh' as const },
        { expiresIn: REFRESH_JWT_EXPIRES_IN },
      );

      return { accessToken, refreshToken };
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException('common.errorMessage', 'INTERNAL_SERVER_ERROR');
    }
  }

  /** `accessToken` JWT 서명 검증 후 페이로드의 플레이어 id(`sub`) */
  async getPlayerIdFromAccessToken(accessToken: string | undefined, dto: SetPlayerRiotReqDto) {
    if (accessToken == null || accessToken === '') {
      throw new CustomException('player.tokenInvalid', 'UNAUTHORIZED');
    }
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string | number;
        typ?: string;
        kind?: string;
      }>(accessToken);
      if (payload.typ !== 'player' || payload.kind !== 'access') {
        throw new CustomException('player.tokenInvalid', 'UNAUTHORIZED');
      }
      const playerId = Number(payload.sub);
      if (!Number.isInteger(playerId) || playerId < 1) {
        throw new CustomException('player.tokenInvalid', 'UNAUTHORIZED');
      }

      const player = await axios.get(`https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${dto.nickname}/${dto.tag}`, {
        headers: {
          'X-Riot-Token': process.env.RIOT_API_KEY
        }
      });

      if (!player.data?.puuid) {
        throw new CustomException('player.riotNotFound', 'NOT_FOUND', {
          field: 'nickname',
          fieldMessage: 'player.riotNotFound',
        });
      }

      const playerUuid = player.data.puuid;
      // 6QdwLqcNlXFiKPZ-69bKrA-UD5gcM7LuDfkWajwZu5JBYgWc3BbiLGRxp4xOC7s3tHSxvHi7FVcMCg == trial uuid
      const playerData = await axios.get(`https://kr.api.riotgames.com/lol/league/v4/entries/by-puuid/${playerUuid}`, {
        headers: {
          'X-Riot-Token': process.env.RIOT_API_KEY
        }
      });

      const firstLeagueEntry = playerData.data?.[0];
      const linkedPuuid = firstLeagueEntry?.puuid ?? playerUuid;
      const totalPlayGameCount =
        (firstLeagueEntry?.wins ?? 0) + (firstLeagueEntry?.losses ?? 0);

      const alreadyPlayerRiotData = await this.prisma.playerSetting.findFirst({
        where: { puuid: linkedPuuid, deletedAt: null },
      });

      if (alreadyPlayerRiotData) {
        throw new CustomException('player.riotAlreadyLinked', 'CONFLICT', {
          field: 'nickname',
          fieldMessage: 'player.riotAlreadyLinked',
        });
      }

      await this.prisma.playerSetting.create({
        data: {
          playerId: playerId,
          leagueId: firstLeagueEntry?.leagueId ?? null,
          tier: firstLeagueEntry?.tier ?? null,
          rank: firstLeagueEntry?.rank ?? null,
          puuid: linkedPuuid,
          totalPlayGame: totalPlayGameCount,
        },
      });

      return "set player Riot Data";

    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException('common.errorMessage', 'INTERNAL_SERVER_ERROR');
    }
  }

}
