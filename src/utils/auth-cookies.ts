import { isLocalHostname } from './hostname.ts'

const DEFAULT_AUTH_COOKIE_PREFIXES = [
  'athena-auth',
  '__Secure-athena-auth',
  'better-auth',
  '__Secure-better-auth',
] as const

export interface ClearAuthCookiesOptions {
  prefixes?: string[]
  hostname?: string
  path?: string
  cookieHeader?: string
}

interface BrowserCookieStore {
  cookie: string
}

function extractCookieNames(cookieHeader: string): string[] {
  const names = new Set<string>()
  for (const rawCookie of cookieHeader.split(';')) {
    const trimmed = rawCookie.trim()
    if (!trimmed) continue

    const eqPos = trimmed.indexOf('=')
    const name = (eqPos > -1 ? trimmed.slice(0, eqPos) : trimmed).trim()
    if (name) {
      names.add(name)
    }
  }
  return Array.from(names)
}

function buildCookieDomainCandidates(hostname: string): string[] {
  const normalized = hostname.trim().replace(/\.$/, '').toLowerCase()
  if (!normalized || isLocalHostname(normalized)) {
    return []
  }

  const labels = normalized.split('.').filter(Boolean)
  if (labels.length < 2) {
    return [normalized, `.${normalized}`]
  }

  const domains = new Set<string>()
  for (let index = 0; index <= labels.length - 2; index += 1) {
    const domain = labels.slice(index).join('.')
    domains.add(domain)
    domains.add(`.${domain}`)
  }
  return Array.from(domains)
}

function getCookieStore(): BrowserCookieStore | null {
  const candidate = (globalThis as { document?: BrowserCookieStore }).document
  if (!candidate || typeof candidate.cookie !== 'string') {
    return null
  }
  return candidate
}

function getRuntimeHostname(): string {
  const fromWindow = (
    globalThis as { window?: { location?: { hostname?: string } } }
  ).window?.location?.hostname
  if (typeof fromWindow === 'string') {
    return fromWindow
  }

  const fromLocation = (
    globalThis as { location?: { hostname?: string } }
  ).location?.hostname
  if (typeof fromLocation === 'string') {
    return fromLocation
  }

  return ''
}

function writeExpiredCookie(
  cookieStore: BrowserCookieStore,
  name: string,
  path: string,
  domain?: string,
) {
  const domainClause = domain ? ` domain=${domain};` : ''
  cookieStore.cookie =
    `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; path=${path};${domainClause}`
}

/**
 * Clears Athena/Better Auth browser cookies by prefix.
 * Returns the cookie names that matched and were targeted for deletion.
 */
export function clearAuthCookies(options: ClearAuthCookiesOptions = {}): string[] {
  const cookieStore = getCookieStore()
  if (!cookieStore) {
    return []
  }

  const cookieHeader = options.cookieHeader ?? cookieStore.cookie
  if (!cookieHeader?.trim()) {
    return []
  }

  const prefixes = options.prefixes?.length ? options.prefixes : [...DEFAULT_AUTH_COOKIE_PREFIXES]
  const cookieNames = extractCookieNames(cookieHeader)
  const namesToClear = cookieNames.filter(name => prefixes.some(prefix => name.startsWith(prefix)))
  if (namesToClear.length === 0) {
    return []
  }

  const path = options.path?.trim() || '/'
  const hostname = options.hostname ?? getRuntimeHostname()
  const domainCandidates = buildCookieDomainCandidates(hostname)

  for (const name of namesToClear) {
    writeExpiredCookie(cookieStore, name, path)
    for (const domain of domainCandidates) {
      writeExpiredCookie(cookieStore, name, path, domain)
    }
  }

  return namesToClear
}
