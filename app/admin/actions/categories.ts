"use server"

import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"

import { requireAdminUser, requireCmsUser } from "@/lib/auth"
import { clearDataCache } from "@/lib/data-cache"
import { can } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import {
  ensurePermission,
  uniqueCategorySlug,
} from "@/app/admin/actions-helpers"

export async function createCategory(formData: FormData) {
  const currentUser = await requireAdminUser()
  ensurePermission(can(currentUser.role, "create-category"), "/admin?tab=categories&toast=post_action_forbidden")

  const name = String(formData.get("name") || "").trim()
  const description = String(formData.get("description") || "").trim()
  const parentIdRaw = String(formData.get("parentId") || "").trim()
  const parentId = parentIdRaw ? parentIdRaw : null

  if (!name) {
    redirect("/admin?tab=categories&toast=category_delete_failed")
  }

  const maxSortOrder = await prisma.category.aggregate({ _max: { sortOrder: true } })
  const nextSortOrder = (maxSortOrder._max.sortOrder || 0) + 1

  const slug = await uniqueCategorySlug(name)
  await prisma.category.upsert({
    where: { slug },
    update: { name, description, sortOrder: nextSortOrder, parentId },
    create: { name, slug, description, sortOrder: nextSortOrder, parentId },
  })

  revalidateTag("categories")
  clearDataCache()
  redirect("/admin?tab=categories&toast=category_created")
}

export async function updateCategory(formData: FormData) {
  const currentUser = await requireCmsUser()
  ensurePermission(can(currentUser.role, "edit-category"), "/admin?tab=categories&toast=post_action_forbidden")

  const categoryId = String(formData.get("categoryId") || "")
  const name = String(formData.get("name") || "").trim()
  const description = String(formData.get("description") || "").trim()
  const parentIdRaw = String(formData.get("parentId") || "").trim()
  const parentId = parentIdRaw ? parentIdRaw : null

  if (!categoryId || !name) {
    redirect("/admin?tab=categories&toast=category_delete_failed")
  }

  const existingCategory = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, slug: true },
  })

  if (!existingCategory) {
    redirect("/admin?tab=categories&toast=category_delete_failed")
  }

  // Prevent setting itself as parent
  if (parentId === categoryId) {
    redirect("/admin?tab=categories&toast=category_updated")
  }

  const slug = await uniqueCategorySlug(name, categoryId)

  await prisma.category.update({
    where: { id: categoryId },
    data: { name, description, slug, parentId },
  })

  revalidateTag("categories")
  clearDataCache()
  redirect("/admin?tab=categories&toast=category_updated")
}

export async function reorderCategory(formData: FormData) {
  const currentUser = await requireCmsUser()
  ensurePermission(can(currentUser.role, "edit-category"), "/admin?tab=categories&toast=post_action_forbidden")

  const categoryId = String(formData.get("categoryId") || "")
  const direction = String(formData.get("direction") || "")

  if (!categoryId || !["up", "down"].includes(direction)) {
    redirect("/admin?tab=categories&toast=category_reorder_failed")
  }

  const orderedCategories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, sortOrder: true, slug: true },
  })

  const currentIndex = orderedCategories.findIndex((item) => item.id === categoryId)
  if (currentIndex < 0) {
    redirect("/admin?tab=categories&toast=category_reorder_failed")
  }

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
  if (targetIndex < 0 || targetIndex >= orderedCategories.length) {
    redirect("/admin?tab=categories&toast=category_reorder_failed")
  }

  const swapped = [...orderedCategories]
  const currentItem = swapped[currentIndex]
  const targetItem = swapped[targetIndex]
  swapped[currentIndex] = targetItem
  swapped[targetIndex] = currentItem

  await prisma.$transaction(
    swapped.map((item, index) =>
      prisma.category.update({
        where: { id: item.id },
        data: { sortOrder: index + 1 },
      })
    )
  )

  revalidateTag("categories")
  clearDataCache()
  redirect(`/admin?tab=categories&toast=category_reordered&moved=${currentItem.id}&direction=${direction}`)
}

export async function deleteCategory(formData: FormData) {
  const currentUser = await requireCmsUser()
  if (!can(currentUser.role, "delete-category")) {
    return { toast: "post_action_forbidden" }
  }

  const categoryId = String(formData.get("categoryId") || "")
  const moveToCategoryId = String(formData.get("moveToCategoryId") || "")

  if (!categoryId) {
    return { toast: "category_delete_failed" }
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, slug: true, _count: { select: { posts: true } } },
  })

  if (!category) {
    return { toast: "category_delete_failed" }
  }

  if (category._count.posts > 0) {
    if (!moveToCategoryId || moveToCategoryId === categoryId) {
      return { toast: "category_delete_failed" }
    }

    const targetCategory = await prisma.category.findUnique({
      where: { id: moveToCategoryId },
      select: { id: true, slug: true },
    })

    if (!targetCategory) {
      return { toast: "category_delete_failed" }
    }

    await prisma.$transaction([
      prisma.post.updateMany({
        where: { categoryId },
        data: { categoryId: targetCategory.id },
      }),
      prisma.category.delete({ where: { id: categoryId } }),
    ])

    revalidateTag("category-posts")
  } else {
    await prisma.category.delete({ where: { id: categoryId } })
  }

  revalidateTag("categories")
  clearDataCache()
  return { toast: "category_deleted" }
}
