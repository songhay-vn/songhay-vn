import { NextResponse } from "next/server"

import { authCookieName, decodeSession } from "@/lib/auth"
import { uploadImageToCloudinary } from "@/lib/cloudinary"
import { attachMediaUsage } from "@/lib/media-usage"
import { prisma } from "@/lib/prisma"
import { readCookie, toPaging } from "@/lib/query-utils"

const DEFAULT_PAGE_SIZE = 12
const MAX_PAGE_SIZE = 48

const SUPPORTED_IMAGE_EXTENSION_REGEX = /\.(gif|png|jpe?g|webp|avif)$/i

function resolveImageMimeType(file: File) {
  if (file.type.startsWith("image/")) {
    return file.type
  }

  const lowerName = file.name.toLowerCase()
  if (lowerName.endsWith(".gif")) return "image/gif"
  if (lowerName.endsWith(".png")) return "image/png"
  if (lowerName.endsWith(".webp")) return "image/webp"
  if (lowerName.endsWith(".avif")) return "image/avif"
  if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) return "image/jpeg"
  return "image/jpeg"
}

export async function GET(request: unknown) {
  const incomingRequest = request as Request
  const token = readCookie(incomingRequest.headers.get("cookie"), authCookieName)
  const session = decodeSession(token)

  if (!session) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const url = new URL(incomingRequest.url)
  const search = String(url.searchParams.get("search") || "").trim()
  const uploaderIdParam = String(url.searchParams.get("uploaderId") || "").trim()
  const page = toPaging(url.searchParams.get("page"), 1)
  const requestedPageSize = toPaging(url.searchParams.get("pageSize"), DEFAULT_PAGE_SIZE)
  const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE)
  const uploaderIdFilter = uploaderIdParam.length > 0 ? uploaderIdParam : ""
  const includeUsage = url.searchParams.get("includeUsage") === "1"

  const where = {
    assetType: "IMAGE" as const,
    ...(uploaderIdFilter.length > 0 ? { uploaderId: uploaderIdFilter } : {}),
    ...(search.length > 0
      ? {
        OR: [
          { displayName: { contains: search, mode: "insensitive" as const } },
          { filename: { contains: search, mode: "insensitive" as const } },
        ],
      }
      : {}),
  }

  const totalCount = await prisma.mediaAsset.count({ where })
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const currentPage = Math.min(page, totalPages)

  const items = await prisma.mediaAsset.findMany({
    where,
    select: {
      id: true,
      assetType: true,
      visibility: true,
      url: true,
      displayName: true,
      filename: true,
      mimeType: true,
      sizeBytes: true,
      uploadedAt: true,
      uploader: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ uploadedAt: "desc" }],
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  })

  const itemsWithUsage = includeUsage
    ? await attachMediaUsage(items)
    : items

  const uploaderOptions = await prisma.user.findMany({
    where: {
      mediaAssets: {
        some: {
          assetType: "IMAGE",
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: [{ name: "asc" }, { email: "asc" }],
  })

  return NextResponse.json({
    items: itemsWithUsage,
    uploaderOptions,
    pagination: {
      totalCount,
      totalPages,
      page: currentPage,
      pageSize,
    },
  })
}

export async function POST(request: unknown) {
  const incomingRequest = request as Request
  const token = readCookie(incomingRequest.headers.get("cookie"), authCookieName)
  const session = decodeSession(token)

  if (!session) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const formData = await incomingRequest.formData()
  const file = formData.get("file")
  const displayNameInput = String(formData.get("displayName") || "").trim()
  const skipLibrary = formData.get("skipLibrary") === "true"

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "invalid_file" }, { status: 400 })
  }

  const isImageMimeType = file.type.startsWith("image/")
  const hasSupportedImageExtension = SUPPORTED_IMAGE_EXTENSION_REGEX.test(
    file.name
  )

  if (!isImageMimeType && !hasSupportedImageExtension) {
    return NextResponse.json({ error: "invalid_file_type" }, { status: 400 })
  }

  const imageMimeType = resolveImageMimeType(file)

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  try {
    const { url, publicId } = await uploadImageToCloudinary({
      buffer,
      filename: file.name,
      mimeType: imageMimeType,
      folder: "songhay/editor",
      transformation: "c_limit,w_1920",
    })

    let asset = null
    if (!skipLibrary) {
      asset = await prisma.mediaAsset.create({
        data: {
          assetType: "IMAGE",
          publicId,
          visibility: "SHARED",
          url,
          displayName: displayNameInput.length > 0 ? displayNameInput.slice(0, 120) : null,
          filename: file.name,
          mimeType: imageMimeType,
          sizeBytes: file.size,
          uploaderId: session.userId,
        },
        select: {
          id: true,
          url: true,
        },
      })
    }

    return NextResponse.json({ url, asset })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "upload_failed" },
      { status: 500 }
    )
  }
}
