import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SetRoomSettingRequestDto {
  @ApiProperty({ example: '룸 이름', description: '설정할 룸 이름' })
  @IsNotEmpty()
  @IsString()
  name: string;
}