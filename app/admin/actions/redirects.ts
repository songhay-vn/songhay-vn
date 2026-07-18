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
 * Shared helper to synchronize a post's visibility when a redirect is activated or deactivated.
 *
 * REDIRECT_ON  — Hides the post from the public frontend (isPublished: false) but keeps
 *                editorialStatus: "PUBLISHED" so it stays visible in the Admin 'Published' tab.
 *                Also enqueues a GSC inspection of the old URL to let Google discover the 301.
 *
 * REPUBLISH    — Restores the post to full public visibility (isPublished: true).
 *                Enqueues a GSC inspection so Google re-crawls and re-indexes the URL.
 *
 * The helper also handles backward-compat: posts that were set to DRAFT by an older version
 * of the redirect action are treated as REDIRECT_ON posts and updated to the new shape.
 */
async function syncMatchedPostStatus(
  fromPath: string,
  mode: "REDIRECT_ON" | "REPUBLISH" | "DEMOTE_TO_PENDING"
) {
  const pathParts = fromPath.split("/").filter(Boolean)
  if (pathParts.length !== 2) return

  const [categorySlug, postSlug] = pathParts

  const matchedPost = await prisma.post.findFirst({
    where: {
      slug: postSlug,
      category: { slug: categorySlug },
      isDeleted: false,
      // REDIRECT_ON: find posts that are currently public (isPublished: true) OR
      // that were set to DRAFT by the old version (isDraft: true, editorialStatus: "DRAFT").
      // REPUBLISH / DEMOTE_TO_PENDING: find posts that are currently hidden by a redirect (isPublished: false).
      ...(mode === "REDIRECT_ON"
        ? { OR: [{ isPublished: true }, { isDraft: true, editorialStatus: "DRAFT" }] }
        : { isPublished: false }),
    },
    select: { id: true, slug: true, category: { select: { slug: true } } },
  })

  if (!matchedPost) return

  if (mode === "REDIRECT_ON") {
    // Keep editorialStatus PUBLISHED so it stays in the Admin 'Published' tab,
    // but hide from the public frontend by setting isPublished: false.
    await prisma.post.update({
      where: { id: matchedPost.id },
      data: {
        isPublished: false,
        isDraft: false,
        editorialStatus: "PUBLISHED",
      },
    })
  } else if (mode === "REPUBLISH") {
    // Restore to full public visibility
    await prisma.post.update({
      where: { id: matchedPost.id },
      data: {
        isPublished: true,
        isDraft: false,
        editorialStatus: "PUBLISHED",
      },
    })
  } else if (mode === "DEMOTE_TO_PENDING") {
    // Demote to PENDING_PUBLISH (moves to 'Chờ xuất bản' tab)
    await prisma.post.update({
      where: { id: matchedPost.id },
      data: {
        isPublished: false,
        isDraft: false,
        editorialStatus: "PENDING_PUBLISH",
      },
    })
  }

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

  // Hide the old post from the public frontend while keeping it in the Admin Published tab
  await syncMatchedPostStatus(fromPath, "REDIRECT_ON")

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

  if (redirectRow) {
    if (republish) {
      await syncMatchedPostStatus(redirectRow.fromPath, "REPUBLISH")
    } else {
      await syncMatchedPostStatus(redirectRow.fromPath, "DEMOTE_TO_PENDING")
    }
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
      // Activating redirect -> hide matched post from public frontend
      await syncMatchedPostStatus(redirectRow.fromPath, "REDIRECT_ON")
    } else if (republish) {
      // Disabling redirect with republish -> restore matched post to public
      await syncMatchedPostStatus(redirectRow.fromPath, "REPUBLISH")
    } else {
      // Disabling redirect without republish -> demote to PENDING_PUBLISH (Chờ xuất bản)
      await syncMatchedPostStatus(redirectRow.fromPath, "DEMOTE_TO_PENDING")
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
