import {
  buildAtprotoLoopbackClientMetadata,
  type OAuthClientMetadataInput,
} from "@atproto/oauth-client-node"

export const oauthScope = "atproto repo:network.crate.file blob:*/*"
export const serverUrl = process.env["CRATE_SERVER_URL"] ?? "http://127.0.0.1:3030"
export const webUrl = process.env["CRATE_WEB_URL"] ?? "http://127.0.0.1:5173"

export function getClientMetadata(): OAuthClientMetadataInput {
  const redirectUri = `${serverUrl}/oauth/callback`
  if (process.env["NODE_ENV"] !== "production") {
    return buildAtprotoLoopbackClientMetadata({
      redirect_uris: [redirectUri],
      scope: oauthScope,
    })
  }

  return {
    client_id: `${serverUrl}/oauth-client-metadata.json`,
    client_name: "Crate",
    client_uri: webUrl,
    redirect_uris: [redirectUri],
    scope: oauthScope,
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    application_type: "web",
    token_endpoint_auth_method: "none",
    dpop_bound_access_tokens: true,
  }
}
