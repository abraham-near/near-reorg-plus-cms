import { requirePermission } from '@/cms/lib/auth'
import { partLength, putPart, readPart, readTicket } from '@/cms/lib/chunked-upload'
import { HttpError, json, route } from '@/cms/lib/http'

/** PUT /api/admin/media/uploads/part?n=<1..parts> (header X-Upload-Ticket; body: the part's bytes, exactly) */
export const PUT = route(async (req) => {
  const { user } = await requirePermission('media:upload')
  const ticket = readTicket(req.headers.get('x-upload-ticket'), user.id)
  const raw = new URL(req.url).searchParams.get('n') ?? ''
  const n = /^\d{1,5}$/.test(raw) ? Number(raw) : NaN
  if (!Number.isInteger(n) || n < 1 || n > ticket.parts) throw new HttpError(400, 'Invalid part number')
  await putPart(ticket, n, await readPart(req, partLength(ticket.size, n)))
  return json({ ok: true })
})
