import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface CurrentPlayerData {
  id: number;
  typ: 'player';
  kind: 'access' | 'refresh';
  session: string;
}

export const CurrentPlayer = createParamDecorator(
  (field: keyof CurrentPlayerData | undefined, ctx: ExecutionContext) => {
    const player: CurrentPlayerData = (ctx.switchToHttp().getRequest<Request>() as any).player;
    return field ? player?.[field] : player;
  },
);
