import { HttpException } from '@nestjs/common';
import { resolveErrorMessage } from '../contants/error-message/resolve-error-message';
import { HttpStatus } from '../enum/http-status.enum';

interface CustomExceptionOptions {
  messageDetail?: string;
  field?: string;
  /** ERROR_MESSAGE 키 또는 이미 번역된 문구 */
  fieldMessage?: string;
}
export class CustomException extends HttpException {
  constructor(
    message: string = 'common.errorMessage',
    code: keyof typeof HttpStatus = 'INTERNAL_SERVER_ERROR',
    options?: CustomExceptionOptions,
  ) {
    const resolvedMessage = resolveErrorMessage(message);
    const resolvedOptions = options
      ? {
          ...options,
          fieldMessage: options.fieldMessage
            ? resolveErrorMessage(options.fieldMessage)
            : undefined,
        }
      : undefined;

    super(
      {
        message: resolvedMessage,
        code,
        options: resolvedOptions,
      },
      HttpStatus[code],
    );
  }
}
