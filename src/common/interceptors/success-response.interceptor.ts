import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/** 인터셉터 래핑을 건너뛸 때 (파일 스트림, @Res() raw 응답 등) */
export const SKIP_SUCCESS_RESPONSE_KEY = 'skipSuccessResponse';

export const SkipSuccessResponse = () => SetMetadata(SKIP_SUCCESS_RESPONSE_KEY, true);

export interface ApiSuccessBody<T = unknown> {
  success: true;
  data: T;
}

@Injectable()
export class SuccessResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_SUCCESS_RESPONSE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        data: data === undefined ? null : data,
      })),
    );
  }
}
