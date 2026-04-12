import { Controller, Get, Query } from '@nestjs/common';
import { PlayerSettingService } from './player-setting.service';
import { ApiOperation } from '@nestjs/swagger';
import { GetPlayerSettingQueryDto } from './dto/get-player-setting/query.dto';

@Controller('player-setting')
export class PlayerSettingController {
  constructor(private readonly playerSettingService: PlayerSettingService) { }

  @Get('/')
  @ApiOperation({ summary: '플레이어 설정 조회' })
  async getPlayer(@Query() dto: GetPlayerSettingQueryDto) {
    return this.playerSettingService.getPlayer(dto);
  }
}
