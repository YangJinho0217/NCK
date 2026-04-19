import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PlayerSettingController } from './player-setting/player-setting.controller';
import { PlayerSettingService } from './player-setting/player-setting.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const expiresIn = config.get<string>('JWT_EXPIRES_IN') ?? '7d';
        return {
          secret:
            config.get<string>('JWT_SECRET') ??
            'nck-dev-jwt-secret-change-in-env',
          signOptions: {
            // ms.StringValue — env 문자열이면 타입 단언
            expiresIn: expiresIn as `${number}d` | `${number}h` | `${number}m`,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [PlayerSettingController],
  providers: [PlayerSettingService],
})
export class UserPlayerSettingModule { }
