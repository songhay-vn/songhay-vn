import { createHmac } from "node:crypto"

import type { SessionPayload } from "@/types/auth"

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

function getSessionSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "AUTH_SECRET or NEXTAUTH_SECRET environment variable is missing in production"
      )
    }
    return "songhay-dev-secret-change-me"
  }

  return secret
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url")
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8")
}

function signData(data: string) {
  return createHmac("sha256", getSessionSecret())
    .update(data)
    .digest("base64url")
}

export function encodeSession(
  payload: Omit<SessionPayload, "exp">,
  ttlSeconds = SESSION_TTL_SECONDS
) {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  }
  const data = toBase64Url(JSON.stringify(fullPayload))
  const signature = signData(data)
  return `${data}.${signature}`
}

export function decodeSession(
  token: string | undefined | null
): SessionPayload | null {
  if (!token) {
    return null
  }

  const [data, signature] = token.split(".")

  if (!data || !signature) {
    return null
  }

  const expected = signData(data)
  if (expected !== signature) {
    return null
  }

  try {
    const payload = JSON.parse(fromBase64Url(data)) as SessionPayload

    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export const sessionTtlSeconds = SESSION_TTL_SECONDS
