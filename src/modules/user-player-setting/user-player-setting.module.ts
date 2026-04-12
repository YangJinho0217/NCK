import { Module } from '@nestjs/common';
import { PlayerSettingController } from './player-setting/player-setting.controller';
import { PlayerSettingService } from './player-setting/player-setting.service';

@Module({
  controllers: [PlayerSettingController],
  providers: [PlayerSettingService],
})
export class UserPlayerSettingModule { }
