import 'server-only'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { canActor } from '@/cms/lib/permissions'
import type { CurrentSession } from '@/cms/lib/session'
import type { Api } from '../client'
import { GUIDE_URI, REMOTE_INSTRUCTIONS, REMOTE_PROMPTS } from '../guide'
import { assetTools } from '../tools/assets'
import { importTools } from '../tools/import'
import { postTools } from '../tools/posts'
import { readTools } from '../tools/read'
import { register } from '../tools/shared'

/** Tools of the local MCP that need the person's computer (files, the upload folder). */
const LOCAL_ONLY = new Set(['upload_media', 'list_upload_files', 'open_upload_folder', 'import_docx'])

/**
 * The MCP server behind /api/mcp, built for one request and one person: it offers only the tools their
 * connection allows (scopes and role), and every call still goes through the CMS's own checks.
 */
export function createRemoteServer(actor: CurrentSession, api: Api) {
  const server = new McpServer({ name: 'near-cms', title: 'NEAR CMS', version: '2.0.0' }, { instructions: REMOTE_INSTRUCTIONS })
  const tools = [...readTools, ...postTools, ...importTools, ...assetTools]
    .filter((tool) => !LOCAL_ONLY.has(tool.name) && tool.requires.every((permission) => canActor(actor.user, permission)))
  register(server, { ok: true, origin: api.origin, host: new URL(api.origin).host, uploadDir: null }, () => ({ api, uploadDir: null }), tools)
  for (const prompt of REMOTE_PROMPTS) {
    const argsSchema = Object.fromEntries(prompt.args.map((arg) => [arg.name, z.string().max(2048).optional().describe(arg.description)]))
    server.registerPrompt(prompt.name, { title: prompt.title, description: prompt.description, argsSchema }, (args: Record<string, string | undefined>) => ({
      messages: [{ role: 'user', content: { type: 'text', text: prompt.text(args) } }],
    }))
  }
  server.registerResource('guide', GUIDE_URI, { title: 'NEAR CMS guide', description: 'How Claude works with the NEAR CMS: limits, publishing, checklist, Google Docs, errors.', mimeType: 'text/markdown' },
    (uri) => ({ contents: [{ uri: uri.href, mimeType: 'text/markdown', text: REMOTE_INSTRUCTIONS }] }))
  return server
}
