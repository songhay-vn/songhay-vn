import { revalidateTag } from "next/cache"
import { NextResponse } from "next/server"

/**
 * POST /api/redirects/revalidate
 *
 * Called by admin redirect actions (create/delete/toggle) to immediately
 * invalidate the Next.js data cache for the proxy's redirect fetch,
 * so production Edge workers pick up the new redirect table on the next request.
 */
export async function POST() {
  revalidateTag("proxy-redirects", "max")
  return NextResponse.json({ ok: true })
}
