import type { MetadataRoute } from "next"
import { getSiteUrl } from "@/lib/seo"


export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/login", "/api/", "/_next/"],
      },
      {
        userAgent: "FacebookBot",
        allow: "/",
      },
      {
        userAgent: "facebookexternalhit",
        allow: "/",
      },
      {
        userAgent: "FaceBot",
        allow: "/",
      }
    ],
    host: siteUrl,
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
