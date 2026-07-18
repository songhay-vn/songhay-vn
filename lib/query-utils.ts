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
