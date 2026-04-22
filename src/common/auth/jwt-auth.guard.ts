import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { CustomException } from '../exception/exceptions';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const token = req.cookies?.accessToken as string | undefined;

    if (!token) {
      throw new CustomException('player.tokenInvalid', 'UNAUTHORIZED');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      if (payload.typ !== 'player' || payload.kind !== 'access') {
        throw new CustomException('player.tokenInvalid', 'UNAUTHORIZED');
      }

      const playerId = Number(payload.sub);
      if (!Number.isInteger(playerId) || playerId < 1) {
        throw new CustomException('player.tokenInvalid', 'UNAUTHORIZED');
      }

      (req as any).player = { id: playerId, ...payload };
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new CustomException('player.tokenInvalid', 'UNAUTHORIZED');
    }

    return true;
  }
}
