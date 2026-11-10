import { requirePermission } from '@/cms/lib/auth'
import { HttpError, json, parseJson, route } from '@/cms/lib/http'
import { audit } from '@/cms/lib/audit'
import { removeMedia } from '@/cms/components/media/service'
import { bulkDeleteSchema } from '@/cms/components/media/validation'

export const DELETE = route(async (req) => {
  const { user } = await requirePermission('media:delete')
  const { ids, force } = await parseJson(req, bulkDeleteSchema, 16_384)
  const deletedIds: string[] = []
  const failures: { id: string; error: string; status: number }[] = []
  for (const id of ids) {
    try {
      await removeMedia(id, force, user, req)
      deletedIds.push(id)
    } catch (error) {
      if (!(error instanceof HttpError)) throw error
      failures.push({ id, error: error.message, status: error.status })
    }
  }
  await audit(user, { action: 'BULK_DELETE', entityType: 'MEDIA', diff: { deletedIds, failedIds: failures.map((f) => f.id), force } }, req)
  return json({ deleted: deletedIds.length, failed: failures.length, deletedIds, failures })
})
