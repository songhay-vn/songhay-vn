"use client"

import Script from "next/script"
import { usePathname } from "next/navigation"
import { useEffect, Suspense } from "react"

type GoogleAnalyticsProps = {
  measurementId: string
}

type AnalyticsWindow = Window & Record<`ga-disable-${string}`, boolean>

function isAnalyticsExcludedPath(pathname: string | null) {
  return (
    pathname === "/admin" ||
    Boolean(pathname?.startsWith("/admin/")) ||
    pathname === "/login"
  )
}

function GoogleAnalyticsInner({ measurementId }: GoogleAnalyticsProps) {
  const pathname = usePathname()
  const isExcluded = isAnalyticsExcludedPath(pathname)
  const disableKey = `ga-disable-${measurementId}` as const
  const disableKeyLiteral = JSON.stringify(disableKey)
  const measurementIdLiteral = JSON.stringify(measurementId)

  useEffect(() => {
    const analyticsWindow = window as unknown as AnalyticsWindow

    analyticsWindow[disableKey] = isExcluded
  }, [disableKey, isExcluded])

  if (isExcluded) {
    return (
      <Script id="google-analytics-disable-admin" strategy="afterInteractive">
        {`window[${disableKeyLiteral}] = true;`}
      </Script>
    )
  }

  return (
    <>
      <Script id="google-analytics-enable" strategy="lazyOnload">
        {`window[${disableKeyLiteral}] = false;`}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="lazyOnload"
      />
      <Script id="google-analytics" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', ${measurementIdLiteral});
        `}
      </Script>
    </>
  )
}

export function GoogleAnalytics(props: GoogleAnalyticsProps) {
  return (
    <Suspense fallback={null}>
      <GoogleAnalyticsInner {...props} />
    </Suspense>
  )
}
