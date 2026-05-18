import type { AdminTab, UserRow } from "@/app/admin/data-types"
import { prisma } from "@/lib/prisma"

export async function getUsersData(activeTab: AdminTab): Promise<UserRow[]> {
  if (activeTab !== "settings-users" && activeTab !== "settings-password") {
    return []
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  })

  return users
}
