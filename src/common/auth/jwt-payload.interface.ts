export interface JwtPayload {
  sub: number;
  typ: 'player';
  kind: 'access' | 'refresh';
  session: string;
  iat: number;
  exp: number;
}
