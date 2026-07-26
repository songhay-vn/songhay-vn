import type { Prisma } from "@prisma/client"

/**
 * Returns a Prisma where clause for publicly visible published posts.
 *
 * The `now` parameter should always be passed when calling this inside a
 * `"use cache"` function — Next.js 16 PPR forbids implicit `Date.now()` access
 * during static pre-render. Callers outside cache boundaries can omit it.
 */
export function publishedPostWhere(now: Date = new Date()): Prisma.PostWhereInput {
  return {
    isPublished: true,
    isDeleted: false,
    AND: [
      {
        OR: [
          { scheduledPublishAt: null },
          { scheduledPublishAt: { lte: now } },
        ],
      },
    ],
  }
}

export const selectApprovedCommentsCount = {
  select: { comments: { where: { isApproved: true } } },
}

export function readCookie(raw: string | null, name: string): string | null {
  if (!raw) {
    return null
  }

  const chunks = raw.split(";")
  for (const chunk of chunks) {
    const [key, ...rest] = chunk.trim().split("=")
    if (key === name) {
      return decodeURIComponent(rest.join("="))
    }
  }

  return null
}

export function toPaging(input: string | null, fallback: number): number {
  const value = Number.parseInt(input || "", 10)
  if (!Number.isFinite(value) || value <= 0) {
    return fallback
  }
  return value
}

export const toPositiveInt = toPaging

