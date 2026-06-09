type UnknownRecord = Record<string, unknown>
type FontConfig = {
  subsets?: string[]
  weight?: string[]
  variable?: string
}

type FontResult = {
  className: string
  style: UnknownRecord
  variable?: string
}

declare module "next" {
  export type Metadata = UnknownRecord
  export namespace MetadataRoute {
    type Robots = UnknownRecord
    type Sitemap = Array<UnknownRecord>
  }
}

declare module "next/link" {
  type LinkProps = {
    href: string
    className?: string
    children?: import("react").ReactNode
    target?: string
    rel?: string
    ariaLabel?: string
    prefetch?: boolean | null
    scroll?: boolean
    replace?: boolean
    onClick?: import("react").MouseEventHandler<HTMLAnchorElement>
  }

  const Link: (props: LinkProps) => import("react").ReactElement
  export default Link
}

declare module "next/image" {
  type ImageProps = {
    src: string
    alt: string
    width?: number
    height?: number
    fill?: boolean
    sizes?: string
    className?: string
    loading?: "lazy" | "eager"
    priority?: boolean
  }

  const Image: (props: ImageProps) => import("react").ReactElement
  export default Image
}

declare module "next/navigation" {
  export const notFound: () => never
  export const redirect: (href: string) => never
  export const usePathname: () => string
  export const useSearchParams: () => URLSearchParams
  export const useRouter: () => {
    push: (href: string, options?: { scroll?: boolean }) => void
    replace: (href: string, options?: { scroll?: boolean }) => void
  }
}

declare module "next/cache" {
  export const revalidatePath: (path: string) => void
  export const revalidateTag: (tag: string, type?: "max") => void
  export const updateTag: (tag: string) => void
  export const cacheTag: (...tags: string[]) => void
  export const cacheLife: (profile: string | {
    stale?: number
    revalidate?: number
    expire?: number
  }) => void
}

declare module "next/server" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type NextRequest = any
  export const NextResponse: {
    json: (body: unknown, init?: ResponseInit) => Response
  }
  export const connection: () => Promise<void>
  export const after: <T>(
    task: Promise<T> | (() => T | Promise<T>)
  ) => void
}

declare module "next/headers" {
  export const cookies: () => Promise<{
    get: (name: string) => { name: string; value: string } | undefined
    set: (
      name: string,
      value: string,
      options?: {
        httpOnly?: boolean
        sameSite?: "lax" | "strict" | "none"
        secure?: boolean
        path?: string
        maxAge?: number
      }
    ) => void
    delete: (name: string) => void
  }>
}

declare module "next/font/google" {
  export const Be_Vietnam_Pro: (config: FontConfig) => FontResult
  export const Merriweather: (config: FontConfig) => FontResult
}

declare module "next/types.js" {
  export type ResolvingMetadata = unknown
  export type ResolvingViewport = unknown
}

declare module "next/server.js" {
  export type NextRequest = unknown
}
