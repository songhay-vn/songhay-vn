"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { ensurePermission, revalidatePostTagsOnly } from "@/app/admin/actions-helpers"
import { requireCmsUser } from "@/lib/auth"
import { deleteCloudinaryAsset, uploadPenNameAvatar } from "@/lib/cloudinary"
import { clearDataCache } from "@/lib/data-cache"
import { normalizePenName, toPenNameDisplayName } from "@/lib/pen-names"
import { canEditPenNames } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

const PEN_NAME_TAB_PATH = "/admin?tab=settings-pen-names"
const MAX_AVATAR_UPLOAD_BYTES = 5 * 1024 * 1024

async function requirePenNameEditor() {
  const currentUser = await requireCmsUser()
  ensurePermission(
    canEditPenNames(currentUser.role),
    `${PEN_NAME_TAB_PATH}&toast=pen_name_action_forbidden`
  )
  return currentUser
}

function getAvatarUpload(formData: FormData) {
  const file = formData.get("avatarUpload")
  if (!(file instanceof File) || file.size === 0) {
    return null
  }

  return file
}

async function uploadAvatarOrRedirect(file: File | null) {
  if (!file) {
    return null
  }

  if (!file.type.startsWith("image/") || file.size > MAX_AVATAR_UPLOAD_BYTES) {
    redirect(`${PEN_NAME_TAB_PATH}&toast=pen_name_avatar_upload_failed`)
  }

  try {
    return await uploadPenNameAvatar(file)
  } catch {
    redirect(`${PEN_NAME_TAB_PATH}&toast=pen_name_avatar_upload_failed`)
  }
}

async function getLinkedPostRoutes(penNameId: string) {
  return prisma.post.findMany({
    where: { penNameId },
    select: {
      slug: true,
      category: {
        select: {
          slug: true,
        },
      },
    },
  })
}

function revalidateLinkedPosts(
  posts: Array<{ slug: string; category: { slug: string } | null }>
) {
  for (const post of posts) {
    revalidatePostTagsOnly(post.slug, post.category?.slug)
  }
}

export async function createPenName(formData: FormData) {
  await requirePenNameEditor()

  const name = toPenNameDisplayName(String(formData.get("name") || ""))
  const normalizedName = normalizePenName(name)

  if (!name || !normalizedName) {
    redirect(`${PEN_NAME_TAB_PATH}&toast=pen_name_save_failed`)
  }

  const existing = await prisma.penName.findUnique({
    where: { normalizedName },
    select: { id: true },
  })

  if (existing) {
    redirect(`${PEN_NAME_TAB_PATH}&toast=pen_name_duplicated`)
  }

  const avatar = await uploadAvatarOrRedirect(getAvatarUpload(formData))

  await prisma.penName.create({
    data: {
      name,
      normalizedName,
      avatarUrl: avatar?.url || null,
      avatarPublicId: avatar?.publicId || null,
    },
  })

  clearDataCache()
  revalidatePath("/admin")
  redirect(`${PEN_NAME_TAB_PATH}&toast=pen_name_saved`)
}

export async function updatePenName(formData: FormData) {
  await requirePenNameEditor()

  const penNameId = String(formData.get("penNameId") || "").trim()
  const name = toPenNameDisplayName(String(formData.get("name") || ""))
  const normalizedName = normalizePenName(name)

  if (!penNameId || !name || !normalizedName) {
    redirect(`${PEN_NAME_TAB_PATH}&toast=pen_name_save_failed`)
  }

  const existing = await prisma.penName.findUnique({
    where: { id: penNameId },
    select: {
      id: true,
      avatarPublicId: true,
    },
  })

  if (!existing) {
    redirect(`${PEN_NAME_TAB_PATH}&toast=pen_name_not_found`)
  }

  const duplicated = await prisma.penName.findUnique({
    where: { normalizedName },
    select: { id: true },
  })

  if (duplicated && duplicated.id !== penNameId) {
    redirect(`${PEN_NAME_TAB_PATH}&toast=pen_name_duplicated`)
  }

  const linkedPosts = await getLinkedPostRoutes(penNameId)
  const avatar = await uploadAvatarOrRedirect(getAvatarUpload(formData))

  await prisma.$transaction([
    prisma.penName.update({
      where: { id: penNameId },
      data: {
        name,
        normalizedName,
        ...(avatar
          ? {
              avatarUrl: avatar.url,
              avatarPublicId: avatar.publicId || null,
            }
          : {}),
      },
    }),
    prisma.post.updateMany({
      where: { penNameId },
      data: { penName: name },
    }),
  ])

  if (avatar && existing.avatarPublicId) {
    await deleteCloudinaryAsset(existing.avatarPublicId)
  }

  revalidateLinkedPosts(linkedPosts)
  clearDataCache()
  revalidatePath("/admin")
  redirect(`${PEN_NAME_TAB_PATH}&toast=pen_name_saved`)
}

export async function removePenNameAvatar(formData: FormData) {
  await requirePenNameEditor()

  const penNameId = String(formData.get("penNameId") || "").trim()
  if (!penNameId) {
    redirect(`${PEN_NAME_TAB_PATH}&toast=pen_name_save_failed`)
  }

  const existing = await prisma.penName.findUnique({
    where: { id: penNameId },
    select: {
      id: true,
      avatarPublicId: true,
    },
  })

  if (!existing) {
    redirect(`${PEN_NAME_TAB_PATH}&toast=pen_name_not_found`)
  }

  const linkedPosts = await getLinkedPostRoutes(penNameId)

  await prisma.penName.update({
    where: { id: penNameId },
    data: {
      avatarUrl: null,
      avatarPublicId: null,
    },
  })

  if (existing.avatarPublicId) {
    await deleteCloudinaryAsset(existing.avatarPublicId)
  }

  revalidateLinkedPosts(linkedPosts)
  clearDataCache()
  revalidatePath("/admin")
  redirect(`${PEN_NAME_TAB_PATH}&toast=pen_name_avatar_removed`)
}

export async function deletePenName(formData: FormData) {
  await requirePenNameEditor()

  const penNameId = String(formData.get("penNameId") || "").trim()
  if (!penNameId) {
    redirect(`${PEN_NAME_TAB_PATH}&toast=pen_name_delete_failed`)
  }

  const existing = await prisma.penName.findUnique({
    where: { id: penNameId },
    select: {
      id: true,
      avatarPublicId: true,
    },
  })

  if (!existing) {
    redirect(`${PEN_NAME_TAB_PATH}&toast=pen_name_not_found`)
  }

  const linkedPosts = await getLinkedPostRoutes(penNameId)

  await prisma.$transaction([
    prisma.post.updateMany({
      where: { penNameId },
      data: { penNameId: null },
    }),
    prisma.penName.delete({ where: { id: penNameId } }),
  ])

  if (existing.avatarPublicId) {
    await deleteCloudinaryAsset(existing.avatarPublicId)
  }

  revalidateLinkedPosts(linkedPosts)
  clearDataCache()
  revalidatePath("/admin")
  redirect(`${PEN_NAME_TAB_PATH}&toast=pen_name_deleted`)
}
