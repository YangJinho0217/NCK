import { ERROR_MESSAGE } from './index';

export type ErrorLocale = 'ko';

/**
 * ERROR_MESSAGE에 등록된 키를 locale 문구로 치환.
 * 미등록 키는 그대로 반환(디버깅용).
 */
export function resolveErrorMessage(
  key: string,
  locale: ErrorLocale = 'ko',
): string {
  const entry = (ERROR_MESSAGE as Record<string, unknown>)[key];
  if (entry == null) return key;
  if (typeof entry === 'string') return entry;
  if (typeof entry === 'object' && entry !== null) {
    const o = entry as Record<string, string>;
    const localized = o[locale];
    if (typeof localized === 'string') return localized;
    if (typeof o.message === 'string') return o.message;
  }
  return key;
}
