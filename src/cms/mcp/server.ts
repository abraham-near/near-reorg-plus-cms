import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { createApi } from './client'
import { loadConfig, type Config } from './config'
import { GUIDE_URI, INSTRUCTIONS, PROMPTS } from './guide'
import { assetTools } from './tools/assets'
import { importTools } from './tools/import'
import { localTools } from './tools/local'
import { postTools } from './tools/posts'
import { readTools } from './tools/read'
import { register } from './tools/shared'
import { readToken } from './token'

export type ServerDeps = { env?: Record<string, string | undefined>; getToken?: (host: string) => Promise<string> }

export function createServer(deps: ServerDeps = {}) {
  const config: Config = loadConfig(deps.env)
  // The instructions reach the model when a client connects: no skill to download.
  const server = new McpServer({ name: 'near-cms', title: 'NEAR CMS', version: '2.0.0' }, { instructions: INSTRUCTIONS })
  const getToken = deps.getToken ?? readToken
  register(server, config, () => {
    if (!config.ok) throw new Error(config.error)
    return { api: createApi(config.origin, () => getToken(config.host)), uploadDir: config.uploadDir }
  }, [...readTools, ...postTools, ...importTools, ...assetTools, ...localTools])
  for (const prompt of PROMPTS) {
    const argsSchema = Object.fromEntries(prompt.args.map((arg) => [arg.name, z.string().max(200).optional().describe(arg.description)]))
    server.registerPrompt(prompt.name, { title: prompt.title, description: prompt.description, argsSchema }, (args: Record<string, string | undefined>) => ({
      messages: [{ role: 'user', content: { type: 'text', text: prompt.text(args) } }],
    }))
  }
  server.registerResource('guide', GUIDE_URI, { title: 'NEAR CMS guide', description: 'How Claude works with the NEAR CMS: limits, publishing, checklist, Word documents, errors.', mimeType: 'text/markdown' },
    (uri) => ({ contents: [{ uri: uri.href, mimeType: 'text/markdown', text: INSTRUCTIONS }] }))
  return server
}

// Only start on stdio when run directly, so tests can import createServer.
if (process.argv[1] && /cms[\\/]mcp[\\/]server\.ts$/.test(process.argv[1])) {
  createServer().connect(new StdioServerTransport()).catch((e) => {
    console.error('near-cms failed to start:', (e as Error).message)
    process.exit(1)
  })
}
