import "server-only"
import { prisma } from "@/lib/prisma"
import type { AdminTab } from "@/types/admin"

export async function getProductsData(activeTab: AdminTab) {
  if (activeTab !== "products") return []

  return prisma.product.findMany({
    orderBy: [
      { sortOrder: "asc" },
      { createdAt: "desc" },
    ],
  })
}

export type ProductRow = Awaited<ReturnType<typeof getProductsData>>[number]
