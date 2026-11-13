import { z } from 'zod'
import { hmac, safeEqual } from '@/cms/lib/crypto'
import { HttpError, json, parseJson, route } from '@/cms/lib/http'
import { mcpEnabled, OAuthError } from '@/cms/lib/oauth/config'
import { approveAuthorization, denyAuthorization } from '@/cms/lib/oauth/flow'
import { getSession } from '@/cms/lib/session'

const schema = z.object({
  req: z.string().min(10).max(100),
  csrf: z.string().min(10).max(200),
  approve: z.boolean(),
  scopes: z.array(z.string().max(50)).max(10),
}).strict()

/**
 * POST /api/oauth/consent — the person's answer on the consent page. Same-origin only (route()), the
 * session that saw the page (CSRF value bound to session + request), and the request can be answered once.
 */
export const POST = route(async (req) => {
  if (!mcpEnabled()) throw new HttpError(404, 'Not found')
  const session = await getSession()
  if (!session) throw new HttpError(401, 'Sign in again, then go back to Claude and click Connect.')
  const body = await parseJson(req, schema, 4 * 1024)
  if (!safeEqual(body.csrf, hmac(`${session.id}:${body.req}`, 'oauth-consent'))) throw new HttpError(403, 'This page is out of date. Go back to Claude and click Connect again.')
  try {
    const redirectTo = body.approve ? await approveAuthorization(body.req, session.user, body.scopes, req) : await denyAuthorization(body.req)
    return json({ redirectTo })
  } catch (error) {
    if (error instanceof OAuthError) throw new HttpError(400, error.message)
    throw error
  }
})
