import { corsPreflight, oauthGate, oauthJson } from '@/cms/lib/oauth/http'
import { protectedResourceMetadata } from '@/cms/lib/oauth/metadata'

/** RFC 9728 protected resource metadata for /api/mcp (served at both well-known paths). */
export async function GET() {
  return (await oauthGate()) ?? oauthJson(protectedResourceMetadata(), 200, true)
}
export const OPTIONS = corsPreflight
