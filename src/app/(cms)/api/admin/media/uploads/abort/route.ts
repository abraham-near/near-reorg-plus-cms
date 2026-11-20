import { z } from 'zod'
import { requirePermission } from '@/cms/lib/auth'
import { cancelUpload, readTicket } from '@/cms/lib/chunked-upload'
import { json, parseJson, route } from '@/cms/lib/http'

/** POST /api/admin/media/uploads/abort {ticket}: drops the parts sent so far (cancel, a failure, or leaving the page). */
export const POST = route(async (req) => {
  const { user } = await requirePermission('media:upload')
  const { ticket } = await parseJson(req, z.object({ ticket: z.string().min(1).max(4096) }).strict(), 8192)
  await cancelUpload(readTicket(ticket, user.id))
  return json({ ok: true })
})
