import { execFile, spawn } from 'node:child_process'
import { chmod, mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { parseUrl } from './config'
import { configDir, keychainRead, KEYCHAIN_SERVICE, TOKEN_RE, tokenFile } from './token'

const run = promisify(execFile)
const mac = process.platform === 'darwin'

function ask(question: string, hidden: boolean): Promise<string> {
  return new Promise((resolve, reject) => {
    const { stdin, stderr } = process
    if (hidden && !stdin.isTTY) return reject(new Error('A TTY is required to enter the token'))
    stderr.write(question)
    let buf = ''
    if (hidden) stdin.setRawMode(true)
    stdin.setEncoding('utf8')
    stdin.resume()
    const done = (fn: () => void) => {
      stdin.off('data', onData)
      if (hidden) stdin.setRawMode(false)
      stdin.pause()
      stderr.write('\n')
      fn()
    }
    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === '\u0003') return done(() => reject(new Error('Cancelled')))
        if (ch === '\r' || ch === '\n') return done(() => resolve(buf.trim()))
        if (ch === '\u007f' || ch === '\b') buf = buf.slice(0, -1)
        else buf += ch
        if (!hidden && ch !== '\u007f') stderr.write(ch)
      }
    }
    stdin.on('data', onData)
  })
}

// The token goes to `security` on stdin (interactive mode), never as an argument, so it does not
// show up in the process list. Host and token are restricted to characters that need no quoting.
function keychainWrite(host: string, token: string): Promise<void> {
  if (!/^[A-Za-z0-9.:[\]-]+$/.test(host)) return Promise.reject(new Error('Unexpected host'))
  return new Promise((resolve, reject) => {
    const child = spawn('security', ['-i'], { stdio: ['pipe', 'ignore', 'ignore'] })
    child.on('error', () => reject(new Error('could not run security')))
    child.on('close', () => resolve())
    child.stdin.end(`add-generic-password -U -s ${KEYCHAIN_SERVICE} -a ${host} -w ${token}\n`)
  })
}

async function main() {
  const del = process.argv.includes('--delete')
  const defaultUrl = process.env.NEAR_CMS_URL || 'http://localhost:3000'
  const answer = await ask(`CMS URL [${defaultUrl}]: `, false)
  const { origin, host } = parseUrl(answer || defaultUrl)
  if (del) {
    if (mac) await run('security', ['delete-generic-password', '-s', KEYCHAIN_SERVICE, '-a', host]).catch(() => {})
    await unlink(tokenFile(host)).catch(() => {})
    console.error(`Removed stored token for ${host}`)
    return
  }
  const token = await ask('API token (hidden): ', true)
  if (!TOKEN_RE.test(token)) throw new Error('That does not look like a CMS API token (ncms_ + 43 characters)')
  if (mac) {
    await keychainWrite(host, token)
    if (await keychainRead(host) !== token) throw new Error('The Keychain did not accept the token')
    console.error(`Stored token for ${origin} in the macOS Keychain`)
  } else {
    const file = tokenFile(host)
    await mkdir(path.dirname(file), { recursive: true, mode: 0o700 })
    await chmod(configDir(), 0o700)
    await writeFile(file, `${token}\n`, { mode: 0o600 })
    await chmod(file, 0o600)
    console.error(`Stored token for ${origin} in ${file}`)
  }
}

main().catch((e) => {
  // Never print command details: only our own messages.
  console.error(`Login failed: ${e instanceof Error && !('cmd' in e) ? e.message : 'could not update the credential store'}`)
  process.exit(1)
})
