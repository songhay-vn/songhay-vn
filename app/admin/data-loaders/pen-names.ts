import type { AdminTab } from "@/app/admin/data-types"
import { prisma } from "@/lib/prisma"

export type PenNameOption = {
  id: string
  name: string
  avatarUrl: string | null
}

export type PenNameSettingsRow = PenNameOption & {
  avatarPublicId: string | null
  createdAt: Date
  updatedAt: Date
  _count: {
    posts: number
  }
}

export async function getPenNameOptions(
  activeTab: AdminTab
): Promise<PenNameOption[]> {
  if (activeTab !== "write") {
    return []
  }

  return prisma.penName.findMany({
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
      avatarUrl: true,
    },
  })
}

export async function getPenNamesSettingsData(
  activeTab: AdminTab
): Promise<PenNameSettingsRow[]> {
  if (activeTab !== "settings-pen-names") {
    return []
  }

  return prisma.penName.findMany({
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      avatarPublicId: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          posts: true,
        },
      },
    },
  })
}
