import { requireActor } from '@/cms/lib/auth'
import { db } from '@/cms/lib/db'
import { cmsOrigin } from '@/cms/lib/email'
import { json, route } from '@/cms/lib/http'
import { PERMISSIONS, canActor } from '@/cms/lib/permissions'

/** Who is calling and what they can do: lets the MCP server check its setup. */
export const GET = route(async (req) => {
  const { user } = await requireActor(req, 'admin:access')
  const token = user.apiTokenId ? await db.apiToken.findUnique({ where: { id: user.apiTokenId }, select: { name: true, prefix: true, expiresAt: true } }) : null
  return json({
    user: { name: user.name, email: user.email, role: user.role },
    token,
    capabilities: PERMISSIONS.filter((permission) => canActor(user, permission)),
    cmsOrigin: cmsOrigin(),
  })
}, { token: true })
