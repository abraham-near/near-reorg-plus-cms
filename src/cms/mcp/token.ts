import { execFile } from 'node:child_process'
import { lstat, readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'

export const TOKEN_RE = /^ncms_[A-Za-z0-9_-]{43}$/
export const KEYCHAIN_SERVICE = 'near-cms'

export type TokenOptions = {
  configDir?: string
  keychain?: (host: string) => Promise<string | null>
}

export const configDir = () => process.env.NEAR_CMS_CONFIG_DIR || path.join(homedir(), '.config', 'near-cms')
export const tokenFile = (host: string, dir = configDir()) => path.join(dir, `${host.replaceAll(':', '_')}.token`)

export function keychainRead(host: string): Promise<string | null> {
  if (process.platform !== 'darwin') return Promise.resolve(null)
  return new Promise((resolve) => {
    execFile('security', ['find-generic-password', '-s', KEYCHAIN_SERVICE, '-a', host, '-w'], { timeout: 10_000 }, (err, stdout) => {
      resolve(err ? null : String(stdout).trim() || null)
    })
  })
}

const cache = new Map<string, string>()
export const clearTokenCache = () => cache.clear()

function validate(value: string, source: string) {
  const token = value.trim()
  // Never echo the value: only describe what is wrong.
  if (!TOKEN_RE.test(token)) throw new Error(`The token stored in ${source} is malformed (expected ncms_ followed by 43 URL-safe characters). Run npm run mcp:cms:login again.`)
  return token
}

async function readFileToken(file: string) {
  let st
  try { st = await lstat(file) } catch { return null }
  if (st.isSymbolicLink()) throw new Error(`Refusing to read ${file}: it is a symlink`)
  if (!st.isFile()) throw new Error(`Refusing to read ${file}: not a regular file`)
  if (st.mode & 0o077) throw new Error(`Refusing to read ${file}: permissions are too open, run chmod 600 on it`)
  return validate(await readFile(file, 'utf8'), file)
}

export async function readToken(host: string, opts: TokenOptions = {}): Promise<string> {
  const cached = cache.get(host)
  if (cached) return cached
  const fromKeychain = await (opts.keychain ?? keychainRead)(host)
  const token = fromKeychain ? validate(fromKeychain, 'the macOS Keychain') : await readFileToken(tokenFile(host, opts.configDir))
  if (!token) throw new Error(`No API token found for ${host}. Create one in CMS Settings, then run npm run mcp:cms:login`)
  cache.set(host, token)
  return token
}
