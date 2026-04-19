import { COMMON_ERROR_MESSAGE } from './common.error';
import { PLAYER_ERROR_MESSAGE } from './player.error';

/** 키 → locale 문구 (CustomException / Swagger ApiErrorCodes에서 사용) */
export const ERROR_MESSAGE = {
  ...COMMON_ERROR_MESSAGE,
  ...PLAYER_ERROR_MESSAGE,
};

export type ErrorMessageKey = keyof typeof ERROR_MESSAGE;