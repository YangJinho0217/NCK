import { Module } from '@nestjs/common';
import { RoomSettingService } from './room-setting/room-setting.service';
import { RoomSettingController } from './room-setting/room-setting.controller';

@Module({
  providers: [RoomSettingService],
  controllers: [RoomSettingController]
})
export class UserRoomSettingModule {}
