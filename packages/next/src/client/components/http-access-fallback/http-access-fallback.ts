export const HTTPAccessErrorStatus = {
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  UNAUTHORIZED: 401,
}

const ALLOWED_CODES = new Set(Object.values(HTTPAccessErrorStatus))

export const HTTP_ERROR_FALLBACK_ERROR_CODE = 'NEXT_HTTP_ERROR_FALLBACK'

export type HTTPAccessFallbackError = Error & {
  digest: `${typeof HTTP_ERROR_FALLBACK_ERROR_CODE};${string}`
}

/**
 * Checks an error to determine if it's an error generated by
 * the HTTP navigation APIs `notFound()`, `forbidden()` or `unauthorized()`.
 *
 * @param error the error that may reference a HTTP access error
 * @returns true if the error is a HTTP access error
 */
export function isHTTPAccessFallbackError(
  error: unknown
): error is HTTPAccessFallbackError {
  if (
    typeof error !== 'object' ||
    error === null ||
    !('digest' in error) ||
    typeof error.digest !== 'string'
  ) {
    return false
  }
  const [prefix, httpStatus] = error.digest.split(';')

  return (
    prefix === HTTP_ERROR_FALLBACK_ERROR_CODE &&
    ALLOWED_CODES.has(Number(httpStatus))
  )
}

export function getAccessFallbackHTTPStatus(
  error: HTTPAccessFallbackError
): number {
  const httpStatus = error.digest.split(';')[1]
  return Number(httpStatus)
}

export function getAccessFallbackErrorTypeByStatus(
  status: number
): 'not-found' | 'forbidden' | 'unauthorized' | undefined {
  switch (status) {
    case 401:
      return 'unauthorized'
    case 403:
      return 'forbidden'
    case 404:
      return 'not-found'
    default:
      return
  }
}
