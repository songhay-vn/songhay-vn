import { NextResponse } from "next/server"

import { authCookieName, decodeSession } from "@/lib/auth"
import { deleteCloudinaryAsset, extractCloudinaryPublicId } from "@/lib/cloudinary"
import { getMediaUsageByUrl } from "@/lib/media-usage"
import { canDeleteAnyMedia } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

type RouteContext = {
  params: Promise<{ id: string }>
}

function readCookie(raw: string | null, name: string) {
  if (!raw) {
    return null
  }

  const chunks = raw.split(";")
  for (const chunk of chunks) {
    const [key, ...rest] = chunk.trim().split("=")
    if (key === name) {
      return decodeURIComponent(rest.join("="))
    }
  }

  return null
}

export async function DELETE(request: unknown, context: RouteContext) {
  const incomingRequest = request as Request
  const { id } = await context.params
  const requestUrl = new URL(incomingRequest.url)
  const forceDelete = requestUrl.searchParams.get("force") === "1"

  const token = readCookie(incomingRequest.headers.get("cookie"), authCookieName)
  const session = decodeSession(token)

  if (!session) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const asset = await prisma.mediaAsset.findUnique({
    where: { id },
    select: {
      id: true,
      uploaderId: true,
      publicId: true,
      assetType: true,
      url: true,
    },
  })

  if (!asset) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  if (!canDeleteAnyMedia(session.role) && asset.uploaderId !== session.userId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const usage = await getMediaUsageByUrl(asset.url)
  if (usage.count > 0 && !forceDelete) {
    return NextResponse.json({ error: "in_use", usage }, { status: 409 })
  }

  const publicId = asset.publicId || extractCloudinaryPublicId(asset.url)
  if (publicId) {
    const resourceType = asset.assetType === "VIDEO" ? "video" : "image"
    await deleteCloudinaryAsset(publicId, resourceType)
  }

  await prisma.mediaAsset.delete({ where: { id: asset.id } })
  return NextResponse.json({ ok: true })
}
