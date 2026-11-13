import 'server-only'
import { issuer, mcpResource, SCOPES } from './config'

/** RFC 9728: what the MCP endpoint is and who issues its tokens. `resource` is the exact MCP URL. */
export const protectedResourceMetadata = () => ({
  resource: mcpResource(),
  authorization_servers: [issuer()],
  scopes_supported: SCOPES,
  bearer_methods_supported: ['header'],
  resource_name: 'NEAR CMS',
})

/** RFC 8414: how to get tokens. Public clients with PKCE S256 only; clients identified by CIMD. */
export const authorizationServerMetadata = () => ({
  issuer: issuer(),
  authorization_endpoint: `${issuer()}/api/oauth/authorize`,
  token_endpoint: `${issuer()}/api/oauth/token`,
  revocation_endpoint: `${issuer()}/api/oauth/revoke`,
  ...(process.env.CMS_OAUTH_DCR_ENABLED === 'true' ? { registration_endpoint: `${issuer()}/api/oauth/register` } : {}),
  response_types_supported: ['code'],
  grant_types_supported: ['authorization_code', 'refresh_token'],
  code_challenge_methods_supported: ['S256'],
  token_endpoint_auth_methods_supported: ['none'],
  revocation_endpoint_auth_methods_supported: ['none'],
  scopes_supported: SCOPES,
  client_id_metadata_document_supported: true,
  authorization_response_iss_parameter_supported: true,
})
