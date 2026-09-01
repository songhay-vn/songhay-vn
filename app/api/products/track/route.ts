import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { prisma } from "@/lib/prisma"

const trackPayloadSchema = z.object({
  productId: z.string().min(1),
  eventType: z.enum(["view", "zalo_click"]),
})

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    const text = await request.text()
    if (!text) {
      return NextResponse.json({ error: "empty_payload" }, { status: 400 })
    }
    body = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const parsed = trackPayloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 })
  }

  const { productId, eventType } = parsed.data

  try {
    if (eventType === "view") {
      await prisma.product.update({
        where: { id: productId },
        data: {
          viewCount: {
            increment: 1,
          },
        },
        select: { id: true },
      })
    } else if (eventType === "zalo_click") {
      await prisma.product.update({
        where: { id: productId },
        data: {
          zaloClickCount: {
            increment: 1,
          },
        },
        select: { id: true },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Tracking API Error]:", error)
    return NextResponse.json({ error: "failed_to_track" }, { status: 500 })
  }
}
