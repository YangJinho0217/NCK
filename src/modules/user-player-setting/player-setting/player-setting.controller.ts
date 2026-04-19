import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { ApiCommonResponse } from '@src/common/dto/common.dto';
import type { Request, Response } from 'express';
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

@Controller('player-setting')
export class PlayerSettingController {
  constructor(private readonly playerSettingService: PlayerSettingService) { }

  // @Get('/')
  // @ApiOperation({ summary: '플레이어 설정 조회' })
  // async getPlayer(@Query() dto: GetPlayerSettingQueryDto) {
  //   return this.playerSettingService.getPlayer(dto);
  // }

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
    // res.cookie('refreshToken', result.refreshToken, {
    //   ...cookieBase,
    //   maxAge: 24 * 60 * 60 * 1000,
    // });
    return "login success";
  }

  @Post('/set-player')
  @ApiOperation({ summary: '유저 계정 연동' })
  @ApiCommonResponse(PlayerIdFromCookieDataDto, { isArray: false, status: 200 })
  async linkPlayerFromCookie(@Req() req: Request, @Body() dto: SetPlayerRiotReqDto) {
    return await this.playerSettingService.getPlayerIdFromAccessToken(req.cookies?.accessToken, dto);
  }
}
