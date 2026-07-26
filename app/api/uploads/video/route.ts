import { NextResponse } from "next/server"

import { authCookieName, decodeSession } from "@/lib/auth"
import { uploadVideoToCloudinary } from "@/lib/cloudinary"
import { attachMediaUsage } from "@/lib/media-usage"
import { prisma } from "@/lib/prisma"
import { readCookie, toPaging } from "@/lib/query-utils"

const MAX_VIDEO_UPLOAD_BYTES = 200 * 1024 * 1024
const DEFAULT_PAGE_SIZE = 12
const MAX_PAGE_SIZE = 48

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
    assetType: "VIDEO" as const,
    ...(uploaderIdFilter.length > 0 ? { uploaderId: uploaderIdFilter } : {}),
    ...(search.length > 0
      ? {
        AND: [
          {
            OR: [
              { displayName: { contains: search, mode: "insensitive" as const } },
              { filename: { contains: search, mode: "insensitive" as const } },
            ],
          },
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
          assetType: "VIDEO",
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

  if (!file.type.startsWith("video/")) {
    return NextResponse.json({ error: "invalid_file_type" }, { status: 400 })
  }

  if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 413 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  try {
    const { url, publicId } = await uploadVideoToCloudinary({
      buffer,
      filename: file.name,
      mimeType: file.type,
      folder: "songhay/editor/videos",
    })

    let asset = null
    if (!skipLibrary) {
      asset = await prisma.mediaAsset.create({
        data: {
          assetType: "VIDEO",
          publicId,
          visibility: "SHARED",
          url,
          displayName: displayNameInput.length > 0 ? displayNameInput.slice(0, 120) : null,
          filename: file.name,
          mimeType: file.type || "video/mp4",
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
