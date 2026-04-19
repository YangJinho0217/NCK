import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class SetPlayerSettingReqDto {

  @ApiProperty({ example: 'altm56', description: '로그인ID' })
  @IsNotEmpty()
  @IsString()
  loginId: string;

  @ApiProperty({ example: 'trial', description: '닉네임임' })
  @IsNotEmpty()
  @IsString()
  nickName: string;

  @ApiProperty({ example: '123123', description: '패스워드' })
  @IsNotEmpty()
  @IsString()
  password: string;

}

export class TryLoginPlayerReqDto {

  @ApiProperty({ example: 'altm56', description: '로그인ID' })
  @IsNotEmpty()
  @IsString()
  loginId: string;

  @ApiProperty({ example: '123123', description: '패스워드' })
  @IsNotEmpty()
  @IsString()
  password: string;

}

export class SetPlayerRiotReqDto {

  @ApiProperty({ example: 'altm56', description: '로그인ID' })
  @IsNotEmpty()
  @IsString()
  nickname: string;

  @ApiProperty({ example: '123123', description: '패스워드' })
  @IsNotEmpty()
  @IsString()
  tag: string;

}