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
import axios, { AxiosError } from 'axios';

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

      return 'set player success';
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

  private handleRiotApiError(error: AxiosError): never {
    const status = error.response?.status;

    switch (status) {
      case 400:
        throw new CustomException('player.riotNotFound', 'BAD_REQUEST', {
          field: 'nickname',
          fieldMessage: 'player.riotNotFound',
        });
      case 401:
      case 403:
        throw new CustomException('player.riotApiKeyInvalid', 'INTERNAL_SERVER_ERROR');
      case 404:
        throw new CustomException('player.riotNotFound', 'NOT_FOUND', {
          field: 'nickname',
          fieldMessage: 'player.riotNotFound',
        });
      case 429:
        throw new CustomException('player.riotRateLimit', 'TOO_MANY_REQUESTS');
      default:
        throw new CustomException('player.riotServerError', 'INTERNAL_SERVER_ERROR');
    }
  }

  async linkPlayerRiotAccount(playerId: number, dto: SetPlayerRiotReqDto) {
    try {
      const riotHeaders = { 'X-Riot-Token': process.env.RIOT_API_KEY };

      let accountRes;
      try {
        accountRes = await axios.get(
          `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(dto.nickname)}/${encodeURIComponent(dto.tag)}`,
          { headers: riotHeaders },
        );
      } catch (error) {
        if (error instanceof AxiosError) this.handleRiotApiError(error);
        throw error;
      }

      if (!accountRes.data?.puuid) {
        throw new CustomException('player.riotNotFound', 'NOT_FOUND', {
          field: 'nickname',
          fieldMessage: 'player.riotNotFound',
        });
      }

      const playerUuid: string = accountRes.data.puuid;

      let leagueRes;
      try {
        leagueRes = await axios.get(
          `https://kr.api.riotgames.com/lol/league/v4/entries/by-puuid/${playerUuid}`,
          { headers: riotHeaders },
        );
      } catch (error) {
        if (error instanceof AxiosError) this.handleRiotApiError(error);
        throw error;
      }

      const firstLeagueEntry = leagueRes.data?.[0];
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

      return 'set player Riot Data';
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException('common.errorMessage', 'INTERNAL_SERVER_ERROR');
    }
  }

  async getPlayerCheckConnect(playerId: number) {
    try {
      const connect = await this.prisma.playerSetting.findFirst({
        where: { playerId, deletedAt: null },
      });

      if (connect) {
        throw new CustomException('player.alreadyConnected', 'CONFLICT', {
          field: 'playerId',
          fieldMessage: 'player.alreadyConnected',
        });
      }

      return 'not connected';
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException('common.errorMessage', 'INTERNAL_SERVER_ERROR');
    }
  }
}
