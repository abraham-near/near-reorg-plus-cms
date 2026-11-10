import { z } from 'zod'
import { requirePermission } from '@/cms/lib/auth'
import { HttpError, json, parseJson, route } from '@/cms/lib/http'
import { revokeProfileSession } from '@/cms/lib/people/sessions'
import { SESSION_COOKIE } from '@/cms/lib/session'

export const DELETE = route(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const session = await requirePermission('admin:access')
  await parseJson(req, z.object({}).strict(), 1_000)
  const result = z.string().min(1).max(100).safeParse((await ctx.params).id)
  if (!result.success) throw new HttpError(400, 'Invalid session ID')
  const revoked = await revokeProfileSession(session, result.data, req)
  const response = json(revoked)
  if (revoked.current) {
    response.cookies.set(SESSION_COOKIE, '', {
      path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 0,
    })
  }
  return response
})
