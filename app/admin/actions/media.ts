"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { MediaAssetType } from "@prisma/client"

import { requireCmsUser } from "@/lib/auth"
import { uploadImageToCloudinary, uploadVideoToCloudinary } from "@/lib/cloudinary"
import { clearDataCache } from "@/lib/data-cache"
import { prisma } from "@/lib/prisma"

const MAX_VIDEO_UPLOAD_BYTES = 200 * 1024 * 1024

export async function uploadMediaAsset(formData: FormData) {
  const currentUser = await requireCmsUser()

  const file = formData.get("file")
  const assetTypeInput = String(formData.get("assetType") || "").trim().toLowerCase()

  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin?tab=media-library&toast=media_upload_failed")
  }

  const isVideo = assetTypeInput === "video"
  const selectedType = isVideo ? MediaAssetType.VIDEO : MediaAssetType.IMAGE

  if (selectedType === MediaAssetType.IMAGE && !file.type.startsWith("image/")) {
    redirect("/admin?tab=media-library&toast=media_upload_failed")
  }

  if (selectedType === MediaAssetType.VIDEO && !file.type.startsWith("video/")) {
    redirect("/admin?tab=media-library&toast=media_upload_failed")
  }

  if (selectedType === MediaAssetType.VIDEO && file.size > MAX_VIDEO_UPLOAD_BYTES) {
    redirect("/admin?tab=media-library&toast=media_upload_failed")
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const { url, publicId } =
    selectedType === MediaAssetType.IMAGE
      ? await uploadImageToCloudinary({
          buffer,
          filename: file.name,
          mimeType: file.type || "image/jpeg",
          folder: "songhay/editor",
          transformation: "c_limit,w_1920",
        })
      : await uploadVideoToCloudinary({
          buffer,
          filename: file.name,
          mimeType: file.type || "video/mp4",
          folder: "songhay/editor/videos",
        })

  await prisma.mediaAsset.create({
    data: {
      assetType: selectedType,
      publicId,
      visibility: "SHARED",
      url,
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      uploaderId: currentUser.id,
    },
  })

  revalidatePath("/admin")
  clearDataCache()
  redirect("/admin?tab=media-library&toast=media_uploaded")
}
