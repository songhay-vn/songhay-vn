import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { memoizeWithTtl } from "@/lib/data-cache"
import { containsForbiddenKeyword } from "@/lib/moderation"
import { prisma } from "@/lib/prisma"
import { isPrismaSchemaMismatchError } from "@/lib/prisma-errors"
import { createRateLimitResponse, getIP, rateLimit } from "@/lib/rate-limit"

const schema = z.object({
  postId: z.string().min(1),
  authorName: z.string().trim().min(2).max(80).optional(),
  content: z.string().min(3).max(800),
})

export async function POST(request: NextRequest) {
  const ip = getIP(request)
  const { success, reset } = rateLimit(ip, { limit: 5, windowMs: 60 * 1000 })

  if (!success) {
    return createRateLimitResponse(reset)
  }

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 })
  }

  const post = await prisma.post.findUnique({ where: { id: parsed.data.postId }, select: { id: true } })
  if (!post) {
    return NextResponse.json({ error: "post_not_found" }, { status: 404 })
  }

  const authorName = parsed.data.authorName?.trim() || "Bạn đọc"
  const forbiddenKeywords = await memoizeWithTtl(
    "forbidden-keywords",
    300,
    () => prisma.forbiddenKeyword.findMany({
      select: { normalizedTerm: true },
    })
  ).catch((error) => {
    if (isPrismaSchemaMismatchError(error)) {
      return []
    }

    throw error
  })
  const hasForbiddenKeyword = containsForbiddenKeyword(
    parsed.data.content,
    forbiddenKeywords.map((item) => item.normalizedTerm)
  )

  try {
    await prisma.comment.create({
      data: {
        postId: parsed.data.postId,
        authorId: null,
        authorName,
        content: parsed.data.content,
        isApproved: !hasForbiddenKeyword,
        containsBlockedKeyword: hasForbiddenKeyword,
      },
    })
  } catch (error) {
    if (!isPrismaSchemaMismatchError(error)) {
      throw error
    }

    await prisma.comment.create({
      data: {
        postId: parsed.data.postId,
        authorId: null,
        authorName,
        content: parsed.data.content,
        isApproved: !hasForbiddenKeyword,
      },
    })
  }

  return NextResponse.json({ success: true, requiresModeration: hasForbiddenKeyword })
}
