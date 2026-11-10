// Only NEAR addresses may hold a CMS account. The list is exact domains (subdomains are not
// implied), so `near.org.evil.com` or `evilnear.org` never pass.
const DEFAULT_DOMAINS = ['near.org', 'near.foundation', 'nearfoundation.com', 'nearsp.com']

export function allowedEmailDomains(): string[] {
  const raw = process.env.CMS_ALLOWED_EMAIL_DOMAINS
  const list = raw ? raw.split(',') : DEFAULT_DOMAINS
  return list.map((d) => d.trim().toLowerCase()).filter(Boolean)
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

export function isAllowedEmail(email: string): boolean {
  const normalized = normalizeEmail(email)
  const at = normalized.lastIndexOf('@')
  if (at <= 0 || at !== normalized.indexOf('@')) return false
  const domain = normalized.slice(at + 1)
  return allowedEmailDomains().includes(domain)
}
