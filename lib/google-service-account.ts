import "server-only"

import { JWT } from "google-auth-library"

import {
  parseGoogleServiceAccountKey,
  SearchConsoleConfigError,
} from "@/lib/search-console"

const jwtClients = new Map<string, JWT>()

function getServiceAccountKeyFromEnv() {
  const encoded = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON_BASE64
  if (!encoded) {
    throw new SearchConsoleConfigError(
      "Missing GOOGLE_SERVICE_ACCOUNT_KEY_JSON_BASE64"
    )
  }

  return parseGoogleServiceAccountKey(encoded)
}

export function isGoogleServiceAccountConfigured() {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON_BASE64)
}

export async function getGoogleServiceAccountAccessToken(scopes: string[]) {
  const scopeKey = [...scopes].sort().join(" ")
  const existing = jwtClients.get(scopeKey)
  const client =
    existing ||
    (() => {
      const key = getServiceAccountKeyFromEnv()
      const jwtClient = new JWT({
        email: key.client_email,
        key: key.private_key,
        scopes,
      })
      jwtClients.set(scopeKey, jwtClient)
      return jwtClient
    })()

  const tokenResponse = await client.getAccessToken()
  if (!tokenResponse.token) {
    throw new SearchConsoleConfigError(
      "Google service account did not return an access token"
    )
  }

  return tokenResponse.token
}
