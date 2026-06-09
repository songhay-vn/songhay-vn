import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { getIP, rateLimit } from "@/lib/rate-limit"

const schema = z.object({
  dwellSeconds: z.number().int().min(1).max(3600),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 })
  }

  const ip = getIP(request)
  const rateLimitKey = `engagement:${ip}:${id}`
  const { success } = rateLimit(rateLimitKey, { limit: 1, windowMs: 30 * 60 * 1000 })

  if (!success) {
    return NextResponse.json({ ok: true, throttled: true })
  }

  try {
    await prisma.postEngagementEvent.create({
      data: {
        postId: id,
        dwellSeconds: parsed.data.dwellSeconds,
      },
    })
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2003") {
      return NextResponse.json({ error: "post_not_found" }, { status: 404 })
    }
    throw error
  }

  return NextResponse.json({ ok: true })
}
