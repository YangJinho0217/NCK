import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@src/core/prisma/prisma.service';
import { GetPlayerSettingQueryDto } from './dto/get-player-setting/query.dto';
import axios from 'axios';

@Injectable()
export class PlayerSettingService {

  constructor(private readonly prisma: PrismaService) { }

  async getPlayer(dto: GetPlayerSettingQueryDto) {
    try {

      const player = await axios.get(`https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${dto.nickname}/${dto.tag}`, {
        headers: {
          'X-Riot-Token': process.env.RIOT_API_KEY
        }
      });

      if (!player.data) {
        throw new NotFoundException('플레이어를 찾을 수 없습니다.');
      }

      const playerUuid = player.data.puuid;
      // 6QdwLqcNlXFiKPZ-69bKrA-UD5gcM7LuDfkWajwZu5JBYgWc3BbiLGRxp4xOC7s3tHSxvHi7FVcMCg == trial uuid
      const playerData = await axios.get(`https://kr.api.riotgames.com/lol/league/v4/entries/by-puuid/${playerUuid}`, {
        headers: {
          'X-Riot-Token': process.env.RIOT_API_KEY
        }
      });
      return playerData.data;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }
}
