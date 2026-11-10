import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

// Prisma 7 reads the connection string here, not from schema.prisma. Local: .env (see .env.example).
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: env('DATABASE_URL') },
})
