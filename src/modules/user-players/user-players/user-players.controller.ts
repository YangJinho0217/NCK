import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@src/common/auth';
import { UserPlayersService } from './user-players.service';
import { GetPlayersReqDto } from './dto/get-players/query.dto';

@Controller('/api/v1/user-players')
export class UserPlayersController {
  constructor(private readonly userPlayersService: UserPlayersService) { }

  @Get('/')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '전체 플레이어 목록 조회' })
  async getAllPlayers(@Query() dto: GetPlayersReqDto) {
    return this.userPlayersService.getAllPlayers(dto);
  }
}
