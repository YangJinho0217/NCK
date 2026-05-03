import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class GetPlayersReqDto {

  @ApiProperty({ example: 'trial', description: '닉네임', required: false })
  @IsOptional()
  @IsString()
  nickname: string;

  @ApiProperty({ example: '#pass', description: '태그', required: false })
  @IsOptional()
  @IsString()
  tag: string;
}