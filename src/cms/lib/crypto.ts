import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

/** URL-safe random token (256 bits by default). */
export const randomToken = (bytes = 32) => randomBytes(bytes).toString('base64url')

export const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')

/** Constant-time string comparison that does not leak length. */
export function safeEqual(a: string, b: string) {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}

export function authSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 32) throw new Error('AUTH_SECRET must be set (32+ characters)')
  return secret
}

export const hmac = (value: string, purpose: string) =>
  createHmac('sha256', authSecret()).update(`${purpose}:${value}`).digest('base64url')

/** `<payload>.<signature>` for short signed values (preview grants, IP hashes). */
export function sign(payload: string, purpose: string) {
  return `${payload}.${hmac(payload, purpose)}`
}

export function verifySigned(value: string | undefined, purpose: string): string | null {
  if (!value) return null
  const dot = value.lastIndexOf('.')
  if (dot <= 0) return null
  const payload = value.slice(0, dot)
  return safeEqual(value.slice(dot + 1), hmac(payload, purpose)) ? payload : null
}

/** Keyed hash for IPs so analytics cannot be reversed by enumerating the address space. */
export const hashIp = (ip: string | null) => (ip ? hmac(ip, 'ip').slice(0, 32) : null)
