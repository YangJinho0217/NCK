import { Injectable } from '@nestjs/common';
import { CustomException } from '@src/common/exception/exceptions';
import { PrismaService } from '@src/core/prisma/prisma.service';
import { GetPlayersReqDto } from './dto/get-players/query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class UserPlayersService {

  constructor(
    private readonly prisma: PrismaService
  ) { }

  async getAllPlayers(dto: GetPlayersReqDto) {
    try {
      const where: Prisma.PlayerSettingWhereInput = { deletedAt: null };
      if (dto.nickname) {
        where.gameNickName = { contains: dto.nickname };
      }
      if (dto.tag) {
        where.gameTag = { contains: dto.tag };
      }
      const players = await this.prisma.playerSetting.findMany({
        where,
        select: {
          id: true,
          player: {
            select: {
              isActive: true
            }
          },
          gameNickName: true,
          gameTag: true,
          rank: true,
          tier: true,
        },
        orderBy: [
          { player: { isActive: 'desc' } },
          { updatedAt: 'desc' },
        ]
      })
      return players.map((p) => ({
        ...p,
        id: String(p.id).padStart(8, '0'),
      }))
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException('common.errorMessage', 'INTERNAL_SERVER_ERROR');
    }
  }
}
