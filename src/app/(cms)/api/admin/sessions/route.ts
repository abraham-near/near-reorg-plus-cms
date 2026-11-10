import { z } from 'zod'
import { requirePermission } from '@/cms/lib/auth'
import { json, parseJson, route } from '@/cms/lib/http'
import { listProfileSessions, revokeOtherProfileSessions } from '@/cms/lib/people/sessions'

export const GET = route(async () => {
  const session = await requirePermission('admin:access')
  return json({ sessions: await listProfileSessions(session) })
})

export const DELETE = route(async (req) => {
  const session = await requirePermission('admin:access')
  await parseJson(req, z.object({}).strict(), 1_000)
  return json(await revokeOtherProfileSessions(session, req))
})
