// Point Prisma at the throwaway test database before any module creates a client.
// DB-backed suites call `describe.skipIf(!hasTestDb)`.
export const hasTestDb = !!process.env.TEST_DATABASE_URL

if (hasTestDb) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
else delete process.env.DATABASE_URL

process.env.AUTH_SECRET ??= 'test-secret-test-secret-test-secret-1234'
process.env.CMS_ALLOWED_EMAIL_DOMAINS ??= 'near.org,near.foundation,nearfoundation.com,nearsp.com'
