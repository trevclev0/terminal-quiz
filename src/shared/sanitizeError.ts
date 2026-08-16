const SECRET_KEY_OR_HEADER =
  /\b((?:authorization|token|api[_-]?key|apikey|secret|password|passwd|access[_-]?key|x-[a-z0-9-]*(?:key|token|secret)))\b\s*[:=]\s*[^\r\n,;&"']+/gi;

const BEARER_TOKEN = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;

const QUERY_PARAM_VALUE = /([?&][^=\s&"']+=)[^&\s"';,]+/g;

export const MAX_ERROR_TEXT_LENGTH = 500;

/**
 * Redacts common secret patterns and query-string values from error text.
 *
 * Applied before error data reaches telemetry or logs — a length cap alone
 * does not remove secrets, and error messages routinely embed URLs, tokens,
 * and user-controlled input. Never trust client-supplied text as-is.
 */
export function sanitizeErrorText(
  input: string,
  maxLength = MAX_ERROR_TEXT_LENGTH,
): string {
  if (!input) return input;
  let text = input;
  text = text.replace(SECRET_KEY_OR_HEADER, "$1=[REDACTED]");
  text = text.replace(BEARER_TOKEN, "Bearer [REDACTED]");
  text = text.replace(QUERY_PARAM_VALUE, "$1[REDACTED]");
  return text.slice(0, maxLength);
}
