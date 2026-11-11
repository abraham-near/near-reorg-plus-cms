import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// Prisma 7 reads the connection string here, not from schema.prisma. Local: .env (see .env.example).
// Not env(): it throws when DATABASE_URL is unset, and `prisma generate` (postinstall) needs no database,
// so `npm ci` must work without one (CI, a fresh clone, a deploy before the database exists).
// migrate/studio still fail clearly without it.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DATABASE_URL ?? '' },
})
