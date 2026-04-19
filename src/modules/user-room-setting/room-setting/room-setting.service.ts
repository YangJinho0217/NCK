import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '@src/core/prisma/prisma.service';
import { SetRoomSettingRequestDto } from './dto/set-room-setting/request.dto';
import { CustomException } from '@src/common/exception/exceptions';

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
      if (error instanceof CustomException) throw error;
      throw new CustomException('common.errorMessage', 'INTERNAL_SERVER_ERROR');
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
      if (error instanceof CustomException) throw error;
      throw new CustomException('common.errorMessage', 'INTERNAL_SERVER_ERROR');
    }
  }
}
