import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UserPlayersController } from './user-players/user-players.controller';
import { UserPlayersService } from './user-players/user-players.service';

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
            expiresIn: expiresIn as `${number}d` | `${number}h` | `${number}m`,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [UserPlayersController],
  providers: [UserPlayersService],
})
export class UserPlayersModule {}
