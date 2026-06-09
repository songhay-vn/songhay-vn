"use client"

import * as React from "react"
import Link from "next/link"
import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type NewsSearchFormProps = {
  action?: string
  queryParam?: string
  defaultValue?: string
  placeholder?: string
  submitAriaLabel?: string
  autoFocus?: boolean
  enableSuggestions?: boolean
  suggestionsLimit?: number
  minSuggestionChars?: number
  className?: string
  inputClassName?: string
  buttonClassName?: string
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
  buttonSize?: React.ComponentProps<typeof Button>["size"]
  onSubmit?: () => void
  onNavigate?: () => void
}

type SearchSuggestionItem = {
  id: string
  title: string
  slug: string
  category: {
    name: string
    slug: string
  }
}

type SearchSuggestionResponse = {
  items?: SearchSuggestionItem[]
}

export function NewsSearchForm({
  action = "/search",
  queryParam = "q",
  defaultValue,
  placeholder = "Tìm kiếm bài viết...",
  submitAriaLabel = "Tìm kiếm",
  autoFocus = false,
  enableSuggestions = false,
  suggestionsLimit = 6,
  minSuggestionChars = 2,
  className,
  inputClassName,
  buttonClassName,
  buttonVariant = "outline",
  buttonSize = "icon-sm",
  onSubmit,
  onNavigate,
}: NewsSearchFormProps) {
  const [value, setValue] = React.useState(defaultValue || "")
  const [isFocused, setIsFocused] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [suggestions, setSuggestions] = React.useState<SearchSuggestionItem[]>([])

  React.useEffect(() => {
    setValue(defaultValue || "")
  }, [defaultValue])

  const normalizedValue = value.trim()
  const shouldFetchSuggestions = enableSuggestions && normalizedValue.length >= minSuggestionChars

  React.useEffect(() => {
    if (!shouldFetchSuggestions) {
      setSuggestions([])
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      try {
        setIsLoading(true)

        const params = new URLSearchParams({
          q: normalizedValue,
          limit: String(suggestionsLimit),
        })

        const response = await fetch(`/api/posts/search?${params.toString()}`, {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        })

        if (!response.ok) {
          setSuggestions([])
          return
        }

        const data = (await response.json()) as SearchSuggestionResponse
        setSuggestions(Array.isArray(data.items) ? data.items : [])
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setSuggestions([])
        }
      } finally {
        setIsLoading(false)
      }
    }, 220)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [normalizedValue, shouldFetchSuggestions, suggestionsLimit])

  const handleSubmit = React.useCallback(() => {
    onSubmit?.()
    onNavigate?.()
    setIsFocused(false)
  }, [onNavigate, onSubmit])

  const showSuggestions =
    shouldFetchSuggestions && isFocused && (isLoading || suggestions.length > 0 || normalizedValue.length > 0)

  return (
    <div className={cn("relative w-full", className)}>
      <form action={action} method="GET" className="relative" onSubmit={handleSubmit}>
        <Input
          type="search"
          name={queryParam}
          value={value}
          autoFocus={autoFocus}
          placeholder={placeholder}
          className={cn("h-10 pl-3 pr-11", inputClassName)}
          onChange={(event) => setValue(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            window.setTimeout(() => setIsFocused(false), 120)
          }}
          autoComplete="off"
        />
        <Button
          type="submit"
          aria-label={submitAriaLabel}
          variant={buttonVariant}
          size={buttonSize}
          className={cn("absolute right-1 top-1/2 -translate-y-1/2", buttonClassName)}
        >
          <Search className="size-4" />
        </Button>
      </form>

      {showSuggestions ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg">
          {isLoading ? (
            <p className="px-3 py-2 text-sm text-zinc-500">Đang tìm...</p>
          ) : suggestions.length > 0 ? (
            <ul className="max-h-80 overflow-y-auto">
              {suggestions.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/${item.category.slug}/${item.slug}`}
                    className="block px-3 py-2 text-sm text-zinc-800 transition hover:bg-zinc-50 hover:text-red-700"
                  >
                    <p className="line-clamp-2 font-medium">{item.title}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{item.category.name}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-2 text-sm text-zinc-500">Không có gợi ý phù hợp.</p>
          )}

          <div>
            <Link
              href={`${action}?${queryParam}=${encodeURIComponent(normalizedValue)}`}
              className="block border-t border-zinc-100 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
            >
              Xem tất cả kết quả cho &quot;{normalizedValue}&quot;
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}
