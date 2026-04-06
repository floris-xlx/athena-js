import type {
  AthenaGatewayEndpointPath,
  AthenaGatewayErrorCode,
  AthenaGatewayErrorDetails,
  AthenaGatewayMethod,
  AthenaGatewayResponse,
} from './types.js'

export interface AthenaGatewayErrorInput {
  code: AthenaGatewayErrorCode
  message: string
  status?: number
  endpoint?: AthenaGatewayEndpointPath
  method?: AthenaGatewayMethod
  requestId?: string
  hint?: string
  cause?: string
}

/**
 * Canonical error for gateway failures.
 * Holds request context and machine-readable classification.
 */
export class AthenaGatewayError extends Error {
  readonly code: AthenaGatewayErrorCode
  readonly status: number
  readonly endpoint?: AthenaGatewayEndpointPath
  readonly method?: AthenaGatewayMethod
  readonly requestId?: string
  readonly hint?: string
  readonly causeDetail?: string

  constructor(input: AthenaGatewayErrorInput) {
    super(input.message)
    this.name = 'AthenaGatewayError'
    this.code = input.code
    this.status = input.status ?? 0
    this.endpoint = input.endpoint
    this.method = input.method
    this.requestId = input.requestId
    this.hint = input.hint
    this.causeDetail = input.cause
  }

  toDetails(): AthenaGatewayErrorDetails {
    return {
      code: this.code,
      message: this.message,
      status: this.status,
      endpoint: this.endpoint,
      method: this.method,
      requestId: this.requestId,
      hint: this.hint,
      cause: this.causeDetail,
    }
  }

  static fromResponse<T>(
    response: AthenaGatewayResponse<T>,
    fallback: Omit<AthenaGatewayErrorInput, 'code' | 'message' | 'status'>,
  ) {
    const details = response.errorDetails
    if (details) {
      return new AthenaGatewayError({
        code: details.code,
        message: details.message,
        status: details.status,
        endpoint: details.endpoint ?? fallback.endpoint,
        method: details.method ?? fallback.method,
        requestId: details.requestId ?? fallback.requestId,
        hint: details.hint,
        cause: details.cause,
      })
    }

    return new AthenaGatewayError({
      code: 'HTTP_ERROR',
      message: response.error ?? 'Gateway request failed',
      status: response.status,
      endpoint: fallback.endpoint,
      method: fallback.method,
      requestId: fallback.requestId,
    })
  }
}

export function isAthenaGatewayError(error: unknown): error is AthenaGatewayError {
  return error instanceof AthenaGatewayError
}
