import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import {
  BIO_AGE_MAX_AGE,
  BIO_AGE_MAX_SCORE,
  BIO_AGE_MIN_AGE,
  calculateEstimatedBioAge,
  getBioAgeResult,
} from "@/lib/bio-age"
import { prisma } from "@/lib/prisma"
import { isPrismaSchemaMismatchError } from "@/lib/prisma-errors"
import { createRateLimitResponse, getIP, rateLimit } from "@/lib/rate-limit"

const schema = z.object({
  sessionId: z.string().trim().min(8).max(128),
  age: z.number().int().min(BIO_AGE_MIN_AGE).max(BIO_AGE_MAX_AGE),
  gender: z.enum(["MALE", "FEMALE"]),
  score: z.number().int().min(0).max(BIO_AGE_MAX_SCORE),
  sourcePath: z.string().trim().min(1).max(160).optional(),
})

function normalizeSourcePath(value: string | undefined) {
  const sourcePath = value?.trim() || "/tinh-tuoi-sinh-hoc"

  if (!sourcePath.startsWith("/")) {
    return "/tinh-tuoi-sinh-hoc"
  }

  return sourcePath.slice(0, 160)
}

export async function POST(request: NextRequest) {
  const ip = getIP(request)
  const { success, reset } = rateLimit(`bio-age:${ip}`, {
    limit: 10,
    windowMs: 60 * 1000,
  })

  if (!success) {
    return createRateLimitResponse(reset)
  }

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 })
  }

  const result = getBioAgeResult(parsed.data.score)
  const estimated = calculateEstimatedBioAge(parsed.data.age, result)
  const sourcePath = normalizeSourcePath(parsed.data.sourcePath)

  try {
    await prisma.bioAgeSubmission.upsert({
      where: {
        sessionId: parsed.data.sessionId,
      },
      create: {
        sessionId: parsed.data.sessionId,
        age: parsed.data.age,
        gender: parsed.data.gender,
        score: parsed.data.score,
        resultKey: result.key,
        estimatedMinAge: estimated.min,
        estimatedMaxAge: estimated.max,
        sourcePath,
      },
      update: {
        age: parsed.data.age,
        gender: parsed.data.gender,
        score: parsed.data.score,
        resultKey: result.key,
        estimatedMinAge: estimated.min,
        estimatedMaxAge: estimated.max,
        sourcePath,
      },
    })
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return NextResponse.json({ success: true, skipped: "schema_pending" })
    }

    throw error
  }

  return NextResponse.json({ success: true })
}
