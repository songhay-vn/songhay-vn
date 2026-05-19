const DEFAULT_SITE_URL = "https://songhay.vn"

export const SITE_NAME = "Songhay.vn"
export const DEFAULT_OG_IMAGE_PATH = "/og-image.png"

export function getSiteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL
  return value.endsWith("/") ? value.slice(0, -1) : value
}

export function toAbsoluteUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl
  }

  const siteUrl = getSiteUrl()
  const normalizedPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`
  return `${siteUrl}${normalizedPath}`
}
