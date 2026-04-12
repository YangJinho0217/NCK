import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class GetPlayerSettingQueryDto {

  @ApiProperty({ example: 'trial', description: '닉네임' })
  @IsNotEmpty()
  @IsString()
  nickname: string;

  @ApiProperty({ example: '#pass', description: '태그' })
  @IsNotEmpty()
  @IsString()
  tag: string;
}