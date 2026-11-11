// Creates (or resets) a CMS account from the command line. The only way to get the first account,
// since sign-up is invite-only. Whoever runs this has database access, so the address counts as
// confirmed: the account can sign in at once, without email. The password is read from the
// CMS_USER_PASSWORD env var or typed at a hidden prompt, never passed as an argument (it would land
// in shell history).
//
//   npm run cms:create-user -- --email you@near.org --name "Your Name" [--role ADMIN|PUBLISHER]
import 'dotenv/config'
import { createInterface } from 'node:readline'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, type Role } from '../src/generated/prisma/client'
import { allowedEmailDomains, isAllowedEmail, normalizeEmail } from '../src/cms/lib/email-domain'
import { hashPassword, passwordSchema } from '../src/cms/lib/password'

const ROLES: Role[] = ['ADMIN', 'PUBLISHER']

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? process.argv[i + 1] : undefined
}

function promptHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    const output = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream }
    output._writeToOutput = (s: string) => {
      if (s.includes(question)) output.output.write(s)
    }
    rl.question(question, (answer) => {
      rl.close()
      process.stdout.write('\n')
      resolve(answer)
    })
  })
}

/** Asks twice, so a typo can't become the password. Three tries, then it gives up. */
async function askPassword(): Promise<string> {
  for (let tries = 0; tries < 3; tries++) {
    const password = await promptHidden('Password (12+ characters): ')
    const check = passwordSchema.safeParse(password)
    if (!check.success) {
      console.error(check.error.issues[0]?.message ?? 'Invalid password')
      continue
    }
    if ((await promptHidden('Confirm password: ')) === password) return password
    console.error('The passwords do not match. Try again.')
  }
  throw new Error('No password set: too many tries.')
}

async function main() {
  const email = normalizeEmail(arg('email') ?? '')
  const name = arg('name') ?? email.split('@')[0]
  const role = (arg('role') ?? 'ADMIN').toUpperCase() as Role
  if (!ROLES.includes(role)) throw new Error(`--role must be one of ${ROLES.join(', ')}`)
  if (!isAllowedEmail(email)) throw new Error(`--email must use an allowed domain (${allowedEmailDomains().join(',')})`)
  const password = process.env.CMS_USER_PASSWORD || (await askPassword())
  passwordSchema.parse(password)

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
  const passwordHash = await hashPassword(password)
  const now = new Date()
  const user = await db.user.upsert({
    where: { email },
    create: { email, name, role, passwordHash, emailVerifiedAt: now },
    update: { role, passwordHash, active: true, failedLogins: 0, lockedUntil: null, passwordChangedAt: now, emailVerifiedAt: now },
  })
  // A reset signs the account out everywhere and revokes its API tokens.
  await db.session.deleteMany({ where: { userId: user.id } })
  await db.apiToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: now, revokeReason: 'PASSWORD_RESET' } })
  await db.auditLog.create({ data: { action: 'USER_CREATED_CLI', entityType: 'USER', entityId: user.id, entityTitle: email, diff: { role } } })
  await db.$disconnect()
  console.log(`${role === 'ADMIN' ? 'Admin' : 'Publisher'} ready: ${email}. Sign in at /admin/login.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
