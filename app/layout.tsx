import type { Metadata } from "next"
import { Be_Vietnam_Pro, Merriweather } from "next/font/google"
import Script from "next/script"
import { Suspense } from "react"

import "./globals.css"
import { AdsenseHydrator } from "@/components/news/adsense-hydrator"
import { FloatingGiftButton } from "@/components/news/floating-gift-button"
import { GoogleAnalytics } from "@/components/seo/google-analytics"
import { JsonLd } from "@/components/seo/json-ld"
import {
  DEFAULT_OG_IMAGE_PATH,
  getSiteUrl,
  SITE_NAME,
  toAbsoluteUrl,
} from "@/lib/seo"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ScrollToTopOnRouteChange } from "@/components/scroll-to-top-on-route-change"
import { cn } from "@/lib/utils"

const fontSans = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700"],
  variable: "--font-sans",
})

const fontSerif = Merriweather({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "700"],
  variable: "--font-serif",
})

const siteUrl = getSiteUrl()
const googleAnalyticsMeasurementId =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-C1ZX5NG9PC"
const defaultDescription =
  "Songhay.vn - cổng thông tin phong cách sống Việt Nam với tin tức song hay, sống khỏe, mẹo hay, đời sống, góc stress, tử vi và video."
const defaultOgImage = toAbsoluteUrl(DEFAULT_OG_IMAGE_PATH)

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE_NAME} | Sống khỏe thuận tự nhiên`,
    template: `%s | ${SITE_NAME}`,
  },
  description: defaultDescription,
  alternates: {
    canonical: "/",
  },
  keywords: [
    "Songhay",
    "tin tuc",
    "song khoe",
    "meo hay",
    "doi song",
    "tu vi",
    "video",
  ],
  authors: [{ name: SITE_NAME }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: `${SITE_NAME} | Sống khỏe thuận tự nhiên`,
    description: defaultDescription,
    type: "website",
    url: siteUrl,
    siteName: SITE_NAME,
    locale: "vi_VN",
    images: [
      {
        url: defaultOgImage,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - Sống khỏe thuận tự nhiên`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Sống khỏe thuận tự nhiên`,
    description: defaultDescription,
    images: [defaultOgImage],
  },
  other: {
    "google-adsense-account": "ca-pub-1176898129958487",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}#organization`,
    name: SITE_NAME,
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: defaultOgImage,
    },
  }

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}#website`,
    url: siteUrl,
    name: SITE_NAME,
    publisher: {
      "@id": `${siteUrl}#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }

  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={cn("antialiased", fontSans.variable, fontSerif.variable)}
    >
      <body>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1176898129958487"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <GoogleAnalytics measurementId={googleAnalyticsMeasurementId} />
        <Suspense fallback={null}>
          <AdsenseHydrator />
        </Suspense>
        <TooltipProvider>
          <Suspense fallback={null}>
            <ScrollToTopOnRouteChange />
          </Suspense>
          <JsonLd data={[organizationJsonLd, websiteJsonLd]} />
          {children}
          <Suspense fallback={null}>
            <FloatingGiftButton />
          </Suspense>
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  )
}
