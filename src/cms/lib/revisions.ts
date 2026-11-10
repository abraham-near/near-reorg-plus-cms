import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import { db } from './db'

// Full snapshots of an entity, taken before each save. Restoring = writing a snapshot back
// through the normal update path (which snapshots the current state first, so a restore can be undone).
export type RevisionEntity = 'POST'

const KEEP = 100 // per entity; older revisions are pruned

export async function saveRevision(
  entityType: RevisionEntity,
  entityId: string,
  snapshot: Prisma.InputJsonValue,
  authorId: string | null,
  message?: string,
) {
  await db.revision.create({ data: { entityType, entityId, snapshot, authorId, message: message?.slice(0, 300) } })
  const stale = await db.revision.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: 'desc' },
    skip: KEEP,
    select: { id: true },
  })
  if (stale.length) await db.revision.deleteMany({ where: { id: { in: stale.map((r) => r.id) } } })
}

export const listRevisions = (entityType: RevisionEntity, entityId: string, take = 50) =>
  db.revision.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: 'desc' },
    take,
    select: { id: true, message: true, createdAt: true, author: { select: { name: true, email: true } } },
  })

export const getRevision = (id: string) => db.revision.findUnique({ where: { id } })
