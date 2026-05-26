import { prisma } from "@/lib/prisma"
import type { AdminTab } from "@/app/admin/data-types"

export async function getHistoryData(activeTab: AdminTab, requestedPage = 1) {
  if (activeTab !== "history") {
    return {
      rows: [],
      totalCount: 0,
      totalPages: 1,
      currentPage: 1,
    }
  }

  const pageSize = 50
  const skip = (requestedPage - 1) * pageSize

  const [totalCount, history] = await Promise.all([
    prisma.postHistory.count(),
    prisma.postHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip,
      include: {
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
            category: {
              select: { slug: true },
            },
          },
        },
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const currentPage = Math.min(requestedPage, totalPages)

  return {
    rows: history,
    totalCount,
    totalPages,
    currentPage,
  }
}