import { corsPreflight, oauthGate, oauthJson } from '@/cms/lib/oauth/http'
import { authorizationServerMetadata } from '@/cms/lib/oauth/metadata'

/** RFC 8414 authorization server metadata. */
export async function GET() {
  return (await oauthGate()) ?? oauthJson(authorizationServerMetadata(), 200, true)
}
export const OPTIONS = corsPreflight
