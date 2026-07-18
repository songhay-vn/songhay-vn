import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

type RedirectEntry = { fromPath: string; toPath: string }

// Module-level cache — survives across requests within the same Edge worker lifetime.
let redirectCache: Map<string, string> | null = null
let cacheExpiresAt = 0
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

async function getRedirects(baseUrl: string): Promise<Map<string, string>> {
  const now = Date.now()
  if (redirectCache && now < cacheExpiresAt) {
    return redirectCache
  }

  try {
    const res = await fetch(`${baseUrl}/api/redirects`, {
      // Bypass Next.js data cache — we manage TTL ourselves
      cache: "no-store",
    })
    if (!res.ok) throw new Error(`/api/redirects returned ${res.status}`)
    const data: RedirectEntry[] = (await res.json()) as RedirectEntry[]
    redirectCache = new Map(data.map((r) => [r.fromPath, r.toPath]))
    cacheExpiresAt = now + CACHE_TTL_MS
  } catch {
    // On fetch failure, keep stale cache if available; otherwise use empty map
    if (!redirectCache) redirectCache = new Map()
  }

  return redirectCache
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NR = NextResponse as any

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip internal Next.js routes, static files, and API routes to avoid loops
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/admin") ||
    pathname.includes(".")
  ) {
    return NR.next() as Response
  }

  const baseUrl = request.nextUrl.origin
  const redirects = await getRedirects(baseUrl)
  const destination = redirects.get(pathname)

  if (destination) {
    const url = request.nextUrl.clone()
    url.pathname = destination
    url.search = "" // drop query params from source URL
    return NR.redirect(url, { status: 301 }) as Response
  }

  return NR.next() as Response
}

export const config = {
  // Run on all page routes — exclude static assets and Next internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
