export type AthenaCookieSameSite = 'strict' | 'lax' | 'none'

export interface AthenaCookieOptions {
  maxAge?: number
  expires?: Date
  domain?: string
  path?: string
  secure?: boolean
  httpOnly?: boolean
  partitioned?: boolean
  sameSite?: AthenaCookieSameSite
  [key: string]: unknown
}

export interface AthenaAuthCookie {
  name: string
  attributes: AthenaCookieOptions
}

export interface AthenaAuthCookies {
  sessionToken: AthenaAuthCookie
  sessionData: AthenaAuthCookie
  dontRememberToken: AthenaAuthCookie
  accountData: AthenaAuthCookie
}

export interface AthenaCookieDefinition {
  name?: string
  attributes?: AthenaCookieOptions
}

export interface AthenaCookieVersionResolverInput {
  session: Record<string, unknown>
  user: Record<string, unknown>
}

export type AthenaCookieVersionResolver =
  | string
  | ((session: Record<string, unknown>, user: Record<string, unknown>) => string | Promise<string>)

export interface AthenaSessionCookieCacheConfig {
  enabled?: boolean
  maxAge?: number
  strategy?: 'compact' | 'jwt' | 'jwe'
  version?: AthenaCookieVersionResolver
}

export interface AthenaCookieAdvancedOptions {
  cookiePrefix?: string
  useSecureCookies?: boolean
  defaultCookieAttributes?: AthenaCookieOptions
  cookies?: Record<string, AthenaCookieDefinition>
  crossSubDomainCookies?: {
    enabled?: boolean
    domain?: string
  }
}

export interface AthenaCookiesOptions {
  baseURL?:
    | string
    | {
        protocol?: 'http' | 'https' | 'auto'
        allowedHosts?: string[]
      }
  session?: {
    expiresIn?: number
    cookieCache?: AthenaSessionCookieCacheConfig
  }
  advanced?: AthenaCookieAdvancedOptions
}

export interface AthenaSessionPair<
  SessionShape extends Record<string, unknown> = Record<string, unknown>,
  UserShape extends Record<string, unknown> = Record<string, unknown>,
> {
  session: SessionShape & { token: string }
  user: UserShape
}

export interface AthenaCookieContextRuntime {
  headers?: Headers
  getCookie?: (name: string) => string | null | undefined
  setCookie: (name: string, value: string, attributes: AthenaCookieOptions) => void
  logger?: {
    debug?: (event: string, payload?: unknown) => void
  }
  setSignedCookie?: (
    name: string,
    value: string,
    secret: string,
    attributes: AthenaCookieOptions,
  ) => void | Promise<void>
  getSignedCookie?: (name: string, secret: string) => string | null | Promise<string | null>
  context: {
    secret?: string
    authCookies: AthenaAuthCookies
    sessionConfig?: {
      expiresIn?: number
    }
    options?: {
      session?: {
        cookieCache?: AthenaSessionCookieCacheConfig
      }
      account?: {
        storeAccountCookie?: boolean
      }
    }
    setNewSession?: (session: AthenaSessionPair) => void
  }
}

export interface AthenaGetCookieCacheConfig<
  SessionShape extends Record<string, unknown> = Record<string, unknown>,
  UserShape extends Record<string, unknown> = Record<string, unknown>,
> {
  cookiePrefix?: string
  cookieName?: string
  isSecure?: boolean
  secret?: string
  strategy?: 'compact' | 'jwt' | 'jwe'
  version?:
    | string
    | ((session: SessionShape, user: UserShape) => string | Promise<string>)
}

export interface AthenaCookieCachePayload<
  SessionShape extends Record<string, unknown> = Record<string, unknown>,
  UserShape extends Record<string, unknown> = Record<string, unknown>,
> {
  session: SessionShape
  user: UserShape
  updatedAt: number
  version?: string
}
