import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '@src/core/prisma/prisma.service';
import { SetRoomSettingRequestDto } from './dto/set-room-setting/request.dto';

@Injectable()
export class RoomSettingService {
  constructor(private readonly prisma: PrismaService) { }


  async getRoomName(name: string) {
    try {
      const room = await this.prisma.room.findFirst({
        where: { name: name, deletedAt: null }
      })
      if (room) {
        throw new BadRequestException('이미 존재하는 방 이름입니다.');
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async setRoom(dto: SetRoomSettingRequestDto) {
    try {
      await this.getRoomName(dto.name);
      await this.prisma.room.create({
        data: {
          name: dto.name
        }
      });
      return "set room success"
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
