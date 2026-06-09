import { NextResponse, connection } from "next/server"

import { drainSearchConsoleJobs } from "@/lib/search-console-queue"

export async function POST(request: Request) {
  await connection()

  const secret = process.env.SEARCH_CONSOLE_CRON_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: "SEARCH_CONSOLE_CRON_SECRET is not configured" },
      { status: 503 }
    )
  }

  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Number.parseInt(searchParams.get("limit") || "10", 10)
  const result = await drainSearchConsoleJobs(
    Number.isFinite(limit) && limit > 0 ? Math.min(limit, 50) : 10
  )

  return NextResponse.json(result)
}
