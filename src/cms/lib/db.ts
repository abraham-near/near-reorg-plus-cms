import 'server-only'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

// One client per process; `next dev` reloads modules, so keep it on globalThis there.
const globalForPrisma = globalThis as unknown as { cmsPrisma?: PrismaClient }

// Prisma 7 talks to Postgres through the `pg` driver adapter. `next build` prerenders with one
// worker per CPU, each with its own pool, so the build caps each pool at 2 connections to stay
// under Postgres' 100-connection default; the running server uses 10.
function createClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: process.env.NEXT_PHASE === 'phase-production-build' ? 2 : 10,
  })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

export const db = globalForPrisma.cmsPrisma ?? createClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.cmsPrisma = db
