import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { getIP, rateLimit } from "@/lib/rate-limit"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const ip = getIP(request)
  const rateLimitKey = `view:${ip}:${id}`
  const { success } = rateLimit(rateLimitKey, { limit: 1, windowMs: 30 * 60 * 1000 })

  if (!success) {
    return NextResponse.json({ ok: true, throttled: true })
  }

  await prisma.post.update({
    where: { id },
    data: { views: { increment: 1 } },
    select: { id: true },
  })

  // Note: We deliberately do NOT revalidate the cache here.
  // Revalidating on every view defeats the purpose of ISR and causes massive cache writes.
  // The view count will naturally update when the page is revalidated via Time-based ISR or edits.

  return NextResponse.json({ ok: true })
}
