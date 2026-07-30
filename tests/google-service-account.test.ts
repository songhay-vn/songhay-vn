import { describe, expect, test, mock } from "bun:test"

mock.module("server-only", () => ({}))

import { isGoogleServiceAccountConfigured } from "@/lib/google-service-account"

describe("Unit: Google Service Account Config", () => {
  test("isGoogleServiceAccountConfigured checks presence of GOOGLE_SERVICE_ACCOUNT_KEY_JSON_BASE64", () => {
    const orig = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON_BASE64
    
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON_BASE64 = "test-base64"
    expect(isGoogleServiceAccountConfigured()).toBe(true)

    delete process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON_BASE64
    expect(isGoogleServiceAccountConfigured()).toBe(false)

    if (orig) {
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON_BASE64 = orig
    }
  })
})
