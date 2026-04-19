import { ApiProperty } from '@nestjs/swagger';

/** 회원가입 성공 시 `data`에 담기는 플레이어 정보 (비밀번호 제외) */
export class PlayerSignUpDataDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'altm56' })
  loginId: string;

  @ApiProperty({ example: 'trial' })
  nickName: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-04-15T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-04-15T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ required: false, nullable: true, example: null })
  deletedAt: Date | null;
}

/** 플레이어 로그인 성공 시 `data` */
export class TryLoginPlayerDataDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…' })
  refreshToken: string;
}

/** `accessToken` 쿠키 JWT 검증 후 플레이어 id */
export class PlayerIdFromCookieDataDto {
  @ApiProperty({ example: 1 })
  playerId: number;
}
