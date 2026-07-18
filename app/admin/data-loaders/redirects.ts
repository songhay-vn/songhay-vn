import type { AdminTab } from "@/app/admin/data-types"
import { memoizeWithTtl } from "@/lib/data-cache"
import { prisma } from "@/lib/prisma"
import { isPrismaSchemaMismatchError } from "@/lib/prisma-errors"

const ADMIN_CACHE_TTL_SECONDS = 10

export type RedirectRow = {
  id: string
  fromPath: string
  toPath: string
  isActive: boolean
  note: string | null
  createdAt: Date
}

export async function getRedirectsData(activeTab: AdminTab): Promise<RedirectRow[]> {
  if (activeTab !== "redirects") return []

  return memoizeWithTtl("admin:redirects", ADMIN_CACHE_TTL_SECONDS, async () => {
    return prisma.redirect
      .findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fromPath: true,
          toPath: true,
          isActive: true,
          note: true,
          createdAt: true,
        },
      })
      .catch((error) => {
        if (isPrismaSchemaMismatchError(error)) return []
        throw error
      })
  })
}
