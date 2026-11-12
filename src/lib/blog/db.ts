import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// The site's own read client for the CMS tables (it never imports src/cms; see src/cms/README.md, "The boundary with the site").
// One per process; `next dev` reloads modules, so it is kept on globalThis there. A small pool: the blog only reads, and its reads are cached (posts.ts).
const globalForBlog = globalThis as unknown as { blogPrisma?: PrismaClient };

function createClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 4 });
  return new PrismaClient({ adapter, log: ["error"] });
}

export const db = globalForBlog.blogPrisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForBlog.blogPrisma = db;
