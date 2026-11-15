import 'server-only'
import { lookup as dnsLookup, type LookupAddress } from 'node:dns'
import { request } from 'node:https'
import { BlockList, isIP } from 'node:net'

// The only way the CMS fetches something from the internet on someone's behalf (Google Docs,
// OAuth client metadata). Built so a URL cannot make the server reach its own network (SSRF):
// - https on port 443 only, no user:password@, no IP addresses: a host name from a fixed allowlist;
// - the name is resolved here and every address checked: private, loopback, link-local, cloud
//   metadata, mapped/NAT64 and documentation ranges are refused, and the connection goes to the
//   address that was checked (no second lookup an attacker could answer differently);
// - redirects are not followed; the caller decides, per hop, through `allowRedirect`;
// - the body is streamed with a byte cap and the whole request has a deadline.

const BLOCKED = new BlockList()
for (const [net, bits] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12],
  ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.88.99.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15],
  ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
] as const) BLOCKED.addSubnet(net, bits, 'ipv4')
for (const [net, bits] of [
  // No ::ffff:0:0/96 here: Node's BlockList matches it against every IPv4 address. Mapped addresses are
  // judged by their embedded IPv4 address in isBlockedAddress().
  ['::', 128], ['::1', 128], ['64:ff9b::', 96], ['64:ff9b:1::', 48], ['100::', 64],
  ['2001::', 32], ['2001:db8::', 32], ['2002::', 16], ['fc00::', 7], ['fe80::', 10], ['fec0::', 10], ['ff00::', 8],
] as const) BLOCKED.addSubnet(net, bits, 'ipv6')

/** Whether an address must never be reached from the server. */
export function isBlockedAddress(address: string): boolean {
  const family = isIP(address)
  if (family === 4) return BLOCKED.check(address, 'ipv4')
  if (family === 6) {
    // IPv4-mapped (::ffff:10.0.0.1) and IPv4-compatible forms: judge the embedded IPv4 address too.
    const v4 = address.match(/^::(?:ffff:)?(\d+\.\d+\.\d+\.\d+)$/i)?.[1]
    return BLOCKED.check(address, 'ipv6') || (!!v4 && BLOCKED.check(v4, 'ipv4'))
  }
  return true
}

export class SafeFetchError extends Error {
  constructor(message: string, public reason: 'url' | 'address' | 'timeout' | 'too-large' | 'network') { super(message) }
}

export type HostRule = string | RegExp
const hostAllowed = (host: string, allow: HostRule[]) => allow.some((rule) => (typeof rule === 'string' ? host === rule : rule.test(host)))

/** Checks a URL against the rules above (without fetching it). Returns the parsed URL. */
export function checkUrl(raw: string, allow: HostRule[]): URL {
  let url: URL
  try { url = new URL(raw) } catch { throw new SafeFetchError('Not a valid URL', 'url') }
  const host = url.hostname.toLowerCase()
  if (url.protocol !== 'https:' || (url.port && url.port !== '443')) throw new SafeFetchError('Only https URLs on the standard port are fetched', 'url')
  if (url.username || url.password) throw new SafeFetchError('URLs with credentials are not fetched', 'url')
  if (isIP(host.replace(/^\[|\]$/g, '')) || host.endsWith('.railway.internal') || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) throw new SafeFetchError('That host is not allowed', 'url')
  if (!hostAllowed(host, allow)) throw new SafeFetchError('That host is not allowed', 'url')
  return url
}

type Lookup = typeof dnsLookup

/** DNS lookup that refuses names resolving (even partly) to a blocked address. */
export const safeLookup = ((hostname: string, options: { all?: boolean; family?: number } | number | ((...args: unknown[]) => void), callback?: (...args: unknown[]) => void) => {
  const cb = (typeof options === 'function' ? options : callback) as (err: Error | null, address?: string | LookupAddress[], family?: number) => void
  const opts = typeof options === 'object' ? options : {}
  dnsLookup(hostname, { all: true }, (err, addresses) => {
    if (err) return cb(err)
    if (!addresses.length || addresses.some((a) => isBlockedAddress(a.address))) return cb(new SafeFetchError('That host resolves to a private address', 'address'))
    if (opts.all) return cb(null, addresses)
    cb(null, addresses[0].address, addresses[0].family)
  })
}) as unknown as Lookup

export type SafeResponse = { status: number; headers: Record<string, string | string[] | undefined>; body: Buffer; url: URL }

export type SafeFetchOptions = {
  allow: HostRule[]
  method?: 'GET' | 'POST'
  headers?: Record<string, string>
  body?: string
  maxBytes: number
  /** For the whole request, connection to last byte. */
  timeoutMs: number
  /** Called for a 3xx with a Location: return true to follow it (checked again like the first URL). At most 3 hops. */
  allowRedirect?: (to: URL, from: URL) => boolean
}

function once(url: URL, opts: SafeFetchOptions, deadline: number): Promise<SafeResponse> {
  return new Promise((resolve, reject) => {
    const remaining = deadline - Date.now()
    if (remaining <= 0) return reject(new SafeFetchError('The request took too long', 'timeout'))
    const req = request(url, {
      method: opts.method ?? 'GET',
      headers: { 'user-agent': 'near-cms', 'accept-encoding': 'identity', ...opts.headers, ...(opts.body !== undefined ? { 'content-length': String(Buffer.byteLength(opts.body)) } : {}) },
      lookup: safeLookup,
      timeout: remaining,
    }, (res) => {
      const declared = Number(res.headers['content-length'] ?? 0)
      if (declared > opts.maxBytes) { res.destroy(); return reject(new SafeFetchError('The response is too large', 'too-large')) }
      const chunks: Buffer[] = []
      let size = 0
      res.on('data', (chunk: Buffer) => {
        size += chunk.length
        if (size > opts.maxBytes) { res.destroy(); req.destroy(); reject(new SafeFetchError('The response is too large', 'too-large')); return }
        chunks.push(chunk)
      })
      res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks), url }))
      res.on('error', (error) => reject(error instanceof SafeFetchError ? error : new SafeFetchError('The connection failed', 'network')))
    })
    const timer = setTimeout(() => req.destroy(new SafeFetchError('The request took too long', 'timeout')), remaining)
    req.on('close', () => clearTimeout(timer))
    req.on('timeout', () => req.destroy(new SafeFetchError('The request took too long', 'timeout')))
    req.on('error', (error) => reject(error instanceof SafeFetchError ? error : new SafeFetchError('The connection failed', 'network')))
    if (opts.body !== undefined) req.write(opts.body)
    req.end()
  })
}

/** Fetches an allowlisted https URL with the protections above. Never throws the remote body at the caller's user. */
export async function safeFetch(raw: string, opts: SafeFetchOptions): Promise<SafeResponse> {
  const deadline = Date.now() + opts.timeoutMs
  let url = checkUrl(raw, opts.allow)
  for (let hop = 0; hop <= 3; hop++) {
    const res = await once(url, opts, deadline)
    const location = res.headers.location
    if (res.status < 300 || res.status >= 400 || typeof location !== 'string') return res
    const next = new URL(location, url)
    if (!opts.allowRedirect?.(next, url)) return res
    url = checkUrl(next.href, opts.allow)
  }
  throw new SafeFetchError('Too many redirects', 'network')
}
