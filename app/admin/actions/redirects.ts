"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireCmsUser } from "@/lib/auth"
import { can } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { clearDataCache } from "@/lib/data-cache"
import { ensurePermission, revalidatePost } from "@/app/admin/actions-helpers"
import {
  enqueuePublishedPostInspection,
  scheduleSearchConsoleDrain,
  buildPublicPostUrl,
} from "@/lib/search-console-queue"

function normalizePath(raw: string): string {
  let trimmed = raw.trim()
  // Strip protocol and any host parts if absolute or protocol-relative
  trimmed = trimmed.replace(/^(https?:)?\/\//i, "/")
  // Ensure leading slash
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`
  // Prevent multiple leading slashes (e.g. //path)
  const cleanSlash = withSlash.replace(/^\/+/, "/")
  // Strip trailing slash except for root "/"
  return cleanSlash.length > 1 ? cleanSlash.replace(/\/$/, "") : cleanSlash
}

/**
 * Shared helper to dynamically switch a post's status and trigger Google Search Console inspection.
 * - toStatus = "DRAFT": Looks for a published post, unpublishes it, and enqueues inspection.
 * - toStatus = "PUBLISHED": Looks for a draft post, publishes it, and enqueues inspection.
 */
async function syncMatchedPostStatus(
  fromPath: string,
  toStatus: "PUBLISHED" | "DRAFT"
) {
  const pathParts = fromPath.split("/").filter(Boolean)
  if (pathParts.length !== 2) return

  const [categorySlug, postSlug] = pathParts
  const isPublishedFilter = toStatus === "DRAFT" // To unpublish, post must be published; to publish, it must be draft/unpublished

  const matchedPost = await prisma.post.findFirst({
    where: {
      slug: postSlug,
      category: { slug: categorySlug },
      isDeleted: false,
      isPublished: isPublishedFilter,
    },
    select: { id: true, slug: true, category: { select: { slug: true } } },
  })

  if (!matchedPost) return

  const isDraft = toStatus === "DRAFT"
  await prisma.post.update({
    where: { id: matchedPost.id },
    data: {
      isPublished: !isDraft,
      isDraft: isDraft,
      editorialStatus: toStatus,
    },
  })

  await revalidatePost(matchedPost.slug, matchedPost.category?.slug, {
    isVisibilityChange: true,
  })

  const publicUrl = buildPublicPostUrl({
    categorySlug: matchedPost.category.slug,
    slug: matchedPost.slug,
  })
  await enqueuePublishedPostInspection(matchedPost.id, publicUrl)
  scheduleSearchConsoleDrain()
}

export async function createRedirect(formData: FormData) {
  const currentUser = await requireCmsUser()
  ensurePermission(
    can(currentUser.role, "create-category"),
    "/admin?tab=redirects&toast=redirect_create_forbidden"
  )

  const fromPath = normalizePath(String(formData.get("fromPath") || ""))
  const toPath = normalizePath(String(formData.get("toPath") || ""))
  const note = String(formData.get("note") || "").trim() || null

  if (!fromPath || !toPath) {
    redirect("/admin?tab=redirects&toast=redirect_create_failed")
  }

  if (fromPath === toPath) {
    redirect("/admin?tab=redirects&toast=redirect_loop_error")
  }

  const existing = await prisma.redirect.findUnique({
    where: { fromPath: toPath },
    select: { toPath: true },
  })
  if (existing?.toPath === fromPath) {
    redirect("/admin?tab=redirects&toast=redirect_loop_error")
  }

  await prisma.redirect.upsert({
    where: { fromPath },
    create: { fromPath, toPath, note },
    update: { toPath, note, isActive: true },
  })

  // Automatically unpublish the old post URL if it exists
  await syncMatchedPostStatus(fromPath, "DRAFT")

  clearDataCache("admin:redirects")
  revalidatePath("/admin")
  redirect("/admin?tab=redirects&toast=redirect_created")
}

export async function deleteRedirect(formData: FormData) {
  const currentUser = await requireCmsUser()
  ensurePermission(
    can(currentUser.role, "create-category"),
    "/admin?tab=redirects&toast=redirect_delete_forbidden"
  )

  const redirectId = String(formData.get("redirectId") || "").trim()
  const republish = formData.get("republish") === "true"
  if (!redirectId) {
    redirect("/admin?tab=redirects&toast=redirect_delete_failed")
  }

  const redirectRow = await prisma.redirect.findUnique({
    where: { id: redirectId },
    select: { fromPath: true },
  })

  if (redirectRow && republish) {
    // Optionally publish the matched post again
    await syncMatchedPostStatus(redirectRow.fromPath, "PUBLISHED")
  }

  await prisma.redirect.delete({ where: { id: redirectId } })

  clearDataCache("admin:redirects")
  revalidatePath("/admin")
  redirect("/admin?tab=redirects&toast=redirect_deleted")
}

export async function toggleRedirect(formData: FormData) {
  const currentUser = await requireCmsUser()
  ensurePermission(
    can(currentUser.role, "create-category"),
    "/admin?tab=redirects&toast=redirect_toggle_failed"
  )

  const redirectId = String(formData.get("redirectId") || "").trim()
  const isActive = formData.get("isActive") === "true"
  const republish = formData.get("republish") === "true"
  if (!redirectId) {
    redirect("/admin?tab=redirects&toast=redirect_toggle_failed")
  }

  const redirectRow = await prisma.redirect.findUnique({
    where: { id: redirectId },
    select: { fromPath: true },
  })

  if (redirectRow) {
    if (!isActive) {
      // Activating redirect -> set post to DRAFT
      await syncMatchedPostStatus(redirectRow.fromPath, "DRAFT")
    } else if (isActive && republish) {
      // Disabling redirect -> set post to PUBLISHED
      await syncMatchedPostStatus(redirectRow.fromPath, "PUBLISHED")
    }
  }

  await prisma.redirect.update({
    where: { id: redirectId },
    data: { isActive: !isActive },
  })

  clearDataCache("admin:redirects")
  revalidatePath("/admin")
  redirect("/admin?tab=redirects&toast=redirect_toggled")
}
