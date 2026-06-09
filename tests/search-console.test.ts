import { beforeEach, describe, expect, mock, test } from "bun:test"

mock.module("server-only", () => ({}))

const {
  buildUrlInspectionRequestBody,
  getDailyInspectionSoftLimit,
  parseGoogleServiceAccountKey,
} = await import("../lib/search-console")

describe("search console helpers", () => {
  const originalLimit = process.env.GSC_DAILY_INSPECTION_SOFT_LIMIT

  beforeEach(() => {
    process.env.GSC_DAILY_INSPECTION_SOFT_LIMIT = originalLimit
  })

  test("parses base64 encoded service account JSON", () => {
    const encoded = Buffer.from(
      JSON.stringify({
        client_email: "indexing-bot@songhay-vn.iam.gserviceaccount.com",
        private_key: "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n",
      }),
      "utf8"
    ).toString("base64")

    expect(parseGoogleServiceAccountKey(encoded)).toEqual({
      client_email: "indexing-bot@songhay-vn.iam.gserviceaccount.com",
      private_key: "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n",
    })
  })

  test("builds the URL Inspection request body with site URL and language", () => {
    expect(
      buildUrlInspectionRequestBody(
        "https://songhay.vn/thoi-su/bai-moi",
        "https://songhay.vn/",
        "vi-VN"
      )
    ).toEqual({
      inspectionUrl: "https://songhay.vn/thoi-su/bai-moi",
      siteUrl: "https://songhay.vn/",
      languageCode: "vi-VN",
    })
  })

  test("falls back to the 1800 daily soft limit when env is invalid", () => {
    process.env.GSC_DAILY_INSPECTION_SOFT_LIMIT = "not-a-number"
    expect(getDailyInspectionSoftLimit()).toBe(1800)
  })
})
