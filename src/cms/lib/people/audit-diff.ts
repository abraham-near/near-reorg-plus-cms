import type { Prisma } from '@/generated/prisma/client'

const SENSITIVE_FIELD = /password|token|secret|session|cookie|authorization|credential|api.?key|private.?key|access.?key/i

/** Audit writers should omit secrets; also redact legacy diffs at the read boundary. */
export function redactAuditDiff(value: Prisma.JsonValue, depth = 0): Prisma.JsonValue {
  if (depth > 20) return '[Nested value omitted]'
  if (Array.isArray(value)) return value.map((item) => redactAuditDiff(item, depth + 1))
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
      key,
      SENSITIVE_FIELD.test(key) ? '[REDACTED]' : redactAuditDiff(item ?? null, depth + 1),
    ]))
  }
  return value
}
