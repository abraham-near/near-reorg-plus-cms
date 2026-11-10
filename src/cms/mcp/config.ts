export type Config =
  | { ok: true; origin: string; host: string; uploadDir: string | null }
  | { ok: false; error: string }

const LOCAL = new Set(['localhost', '127.0.0.1', '[::1]'])

export function parseUrl(raw: string): { origin: string; host: string } {
  let url: URL
  try { url = new URL(raw) } catch { throw new Error('NEAR_CMS_URL is not a valid URL') }
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && LOCAL.has(url.hostname))) {
    throw new Error('NEAR_CMS_URL must use https (http is only allowed for localhost, 127.0.0.1 or ::1)')
  }
  if (url.username || url.password) throw new Error('NEAR_CMS_URL must not contain credentials')
  if (url.pathname !== '/' && url.pathname !== '') throw new Error('NEAR_CMS_URL must not contain a path')
  if (url.search || url.hash) throw new Error('NEAR_CMS_URL must not contain a query or hash')
  return { origin: url.origin, host: url.host }
}

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  try {
    const { origin, host } = parseUrl(env.NEAR_CMS_URL?.trim() || 'http://localhost:3000')
    return { ok: true, origin, host, uploadDir: env.NEAR_CMS_UPLOAD_DIR?.trim() || null }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
