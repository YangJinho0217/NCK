import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoomSettingService } from './room-setting.service';
import { SetRoomSettingRequestDto } from './dto/set-room-setting/request.dto';

@ApiTags('오늘의 룸 생성')
@Controller('room-setting')
export class RoomSettingController {
  constructor(private readonly roomSettingService: RoomSettingService) { }

  @Post('/')
  @ApiOperation({ summary: '룸 설정 저장' })
  async setRoom(@Body() dto: SetRoomSettingRequestDto) {
    return this.roomSettingService.setRoom(dto);
  }
}
