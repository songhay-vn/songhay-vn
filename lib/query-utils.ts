import type { Prisma } from "@prisma/client"

export function publishedPostWhere(): Prisma.PostWhereInput {
  return {
    isPublished: true,
    isDeleted: false,
    AND: [
      {
        OR: [
          { scheduledPublishAt: null },
          { scheduledPublishAt: { lte: new Date() } },
        ],
      },
    ],
  }
}

export const selectApprovedCommentsCount = {
  select: { comments: { where: { isApproved: true } } },
}
