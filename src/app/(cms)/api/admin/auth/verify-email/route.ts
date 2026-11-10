import { z } from 'zod'
import { audit } from '@/cms/lib/audit'
import { confirmEmail } from '@/cms/lib/email-verification'
import { HttpError, clientIp, json, parseJson, route } from '@/cms/lib/http'
import { rateLimit } from '@/cms/lib/rate-limit'

const Body = z.object({ token: z.string().min(20).max(100) })

// POST only: mail scanners prefetch GET links, which must not confirm an address by themselves.
// Confirming does not sign in; the user still enters the password afterwards.
export const POST = route(async (req) => {
  if (!(await rateLimit(`verify:ip:${clientIp(req) ?? 'unknown'}`, 20, 60 * 60)).ok) {
    throw new HttpError(429, 'Too many attempts. Try again later.')
  }
  const { token } = await parseJson(req, Body, 2_000)
  const user = await confirmEmail(token)
  if (!user) throw new HttpError(400, 'This confirmation link is invalid or has expired. Sign in again to get a new one.')
  await audit({ id: user.id, email: user.email }, { action: 'EMAIL_VERIFIED', entityType: 'USER', entityId: user.id, entityTitle: user.email }, req)
  return json({ ok: true })
})
