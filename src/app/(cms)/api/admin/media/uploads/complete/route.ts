import { z } from 'zod'
import { audit } from '@/cms/lib/audit'
import { requirePermission } from '@/cms/lib/auth'
import { finishUpload, readTicket } from '@/cms/lib/chunked-upload'
import { json, parseJson, route } from '@/cms/lib/http'
import { finishReplace } from '@/cms/components/media/service'

const completeSchema = z.object({
  ticket: z.string().min(1).max(4096),
  alt: z.string().trim().max(500).optional(),
  replaceEverywhere: z.boolean().optional(),
  // What the browser read from the video (its tile shows them).
  width: z.number().int().min(1).max(16384).optional(),
  height: z.number().int().min(1).max(16384).optional(),
  duration: z.number().min(0).max(86400).transform(Math.round).optional(),
}).strict()

/**
 * POST /api/admin/media/uploads/complete {ticket, alt?, replaceEverywhere?}: the stored file (201), or for a replacement
 * {media, updated, occurrences, originalRetained} like POST /api/admin/media/[id]/replace. Safe to repeat.
 */
export const POST = route(async (req) => {
  const { user } = await requirePermission('media:upload')
  const input = await parseJson(req, completeSchema, 8192)
  const ticket = readTicket(input.ticket, user.id)
  // A replacement is checked again: the role may have changed since the upload started.
  if (ticket.rid) await requirePermission('media:edit')
  const { media, created, original } = await finishUpload(ticket, user.id, { alt: input.alt, width: input.width, height: input.height, duration: input.duration })
  if (created) await audit(user, { action: 'UPLOAD', entityType: 'MEDIA', entityId: media.id, entityTitle: media.filename }, req)
  if (!original) return json(media, created ? 201 : 200)
  // A repeat (the first call failed or its answer was lost after the file was stored) replaces again: safe, since
  // posts already moved to the new file count 0, and it is what finishes a replacement whose first try failed.
  return json(await finishReplace(original, media, user, req, input.replaceEverywhere !== false))
})
