import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { ApiCommonResponse } from '@src/common/dto/common.dto';
import type { Response } from 'express';
import { Res } from '@nestjs/common';
import {
  SetPlayerRiotReqDto,
  SetPlayerSettingReqDto,
  TryLoginPlayerReqDto,
} from './dto/set-player-setting/request.dto';
import {
  PlayerIdFromCookieDataDto,
  TryLoginPlayerDataDto,
} from './dto/set-player-setting/response.dto';
import { PlayerSettingService } from './player-setting.service';
import { JwtAuthGuard, CurrentPlayer } from '@src/common/auth';

@Controller('/api/v1/player-setting')
export class PlayerSettingController {
  constructor(private readonly playerSettingService: PlayerSettingService) {}

  @Post('/signUp')
  @ApiOperation({ summary: '회원가입' })
  @ApiCommonResponse(String, { isArray: false, status: 200, example: 'set player success' })
  async setPlayer(@Body() dto: SetPlayerSettingReqDto) {
    return this.playerSettingService.setPlayer(dto);
  }

  @Post('/login')
  @ApiOperation({
    summary: '플레이어 로그인',
    description:
      '성공 시 `Set-Cookie: accessToken` — 브라우저 쿠키에 `max-age`/`expires` 없음(세션 쿠키). 액세스 JWT 만료는 서명상 1시간입니다. 같은 출처에서 이후 요청에 자동 전송됩니다.',
  })
  @ApiCommonResponse(TryLoginPlayerDataDto, { isArray: false, status: 200 })
  async tryLoginPlayer(
    @Body() dto: TryLoginPlayerReqDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.playerSettingService.tryLoginPlayer(dto);
    const isProd = process.env.NODE_ENV === 'production';
    const cookieBase = {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax' as const,
      path: '/',
    };
    res.cookie('accessToken', result.accessToken, {
      ...cookieBase,
    });
    return "login success";
  }

  @Get('/player')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '유저 계정 연동 확인' })
  @ApiCommonResponse(String, { isArray: false, status: 200, example: 'get success' })
  async getPlayerCheckConnect(@CurrentPlayer('id') playerId: number) {
    return this.playerSettingService.getPlayerCheckConnect(playerId);
  }

  @Post('/set-player')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '유저 계정 연동' })
  @ApiCommonResponse(PlayerIdFromCookieDataDto, { isArray: false, status: 200 })
  async linkPlayerFromCookie(
    @CurrentPlayer('id') playerId: number,
    @Body() dto: SetPlayerRiotReqDto,
  ) {
    return this.playerSettingService.linkPlayerRiotAccount(playerId, dto);
  }
}
