"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Check, Plus, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { parseSeoKeywordInput } from "@/lib/seo-keywords"

type SeoKeywordOption = {
  id: string
  keyword: string
}

type SeoKeywordPickerProps = {
  options: SeoKeywordOption[]
  initialSelectedIds?: string[]
  initialCustomKeywords?: string[]
}

function normalizeKeyword(raw: string) {
  return raw.trim().toLowerCase().replace(/\s+/g, " ")
}

function labelKeyword(raw: string) {
  return raw.trim().replace(/\s+/g, " ")
}

function mergeKeywordLabels(items: string[]) {
  return parseSeoKeywordInput(items.join(", "))
}

function getActiveKeywordFragment(value: string) {
  const parts = value.split(",")
  return labelKeyword(parts[parts.length - 1] || "")
}

function replaceActiveKeyword(value: string, keyword: string) {
  const activeKeyword = getActiveKeywordFragment(value)
  const normalizedActiveKeyword = normalizeKeyword(activeKeyword)
  const parsedKeywords = parseSeoKeywordInput(value)
  const shouldReplaceActiveKeyword =
    normalizedActiveKeyword.length > 0 &&
    parsedKeywords.length > 0 &&
    normalizeKeyword(parsedKeywords[parsedKeywords.length - 1]) ===
      normalizedActiveKeyword
  const baseKeywords = shouldReplaceActiveKeyword
    ? parsedKeywords.slice(0, -1)
    : parsedKeywords

  return mergeKeywordLabels([...baseKeywords, keyword]).join(", ")
}

export function SeoKeywordPicker({
  options,
  initialSelectedIds = [],
  initialCustomKeywords = [],
}: SeoKeywordPickerProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [keywordText, setKeywordText] = useState(() => {
    const optionById = new Map(options.map((item) => [item.id, item]))
    const selectedKeywords = initialSelectedIds
      .map((id) => optionById.get(id)?.keyword || "")
      .filter(Boolean)

    return mergeKeywordLabels([
      ...selectedKeywords,
      ...initialCustomKeywords,
    ]).join(", ")
  })

  const optionById = useMemo(() => {
    const map = new Map<string, SeoKeywordOption>()
    for (const item of options) {
      map.set(item.id, item)
    }
    return map
  }, [options])

  const optionByNormalizedKeyword = useMemo(() => {
    const map = new Map<string, SeoKeywordOption>()
    for (const item of options) {
      const normalized = normalizeKeyword(item.keyword)
      if (!map.has(normalized)) {
        map.set(normalized, item)
      }
    }
    return map
  }, [options])

  const displayKeywords = useMemo(
    () => parseSeoKeywordInput(keywordText),
    [keywordText]
  )

  const selectedOptions = useMemo(
    () =>
      displayKeywords
        .map((keyword) =>
          optionByNormalizedKeyword.get(normalizeKeyword(keyword))
        )
        .filter((item): item is SeoKeywordOption => Boolean(item)),
    [displayKeywords, optionByNormalizedKeyword]
  )
  const selectedIds = useMemo(
    () => selectedOptions.map((item) => item.id),
    [selectedOptions]
  )
  const customKeywords = useMemo(
    () =>
      displayKeywords.filter(
        (keyword) => !optionByNormalizedKeyword.has(normalizeKeyword(keyword))
      ),
    [displayKeywords, optionByNormalizedKeyword]
  )

  const query = getActiveKeywordFragment(keywordText)
  const normalizedQuery = normalizeKeyword(query)
  const committedKeywords = useMemo(() => {
    if (!normalizedQuery) {
      return displayKeywords
    }

    const lastKeyword = displayKeywords[displayKeywords.length - 1]
    if (lastKeyword && normalizeKeyword(lastKeyword) === normalizedQuery) {
      return displayKeywords.slice(0, -1)
    }

    return displayKeywords
  }, [displayKeywords, normalizedQuery])
  const normalizedCommittedKeywords = useMemo(
    () => new Set(committedKeywords.map((item) => normalizeKeyword(item))),
    [committedKeywords]
  )
  const canCreateQueryKeyword =
    normalizedQuery.length > 0 &&
    !normalizedCommittedKeywords.has(normalizedQuery) &&
    !options.some((item) => normalizeKeyword(item.keyword) === normalizedQuery)

  const suggestions = useMemo(() => {
    const selectedSet = new Set(selectedIds)
    const base = options.filter((item) => !selectedSet.has(item.id))
    if (!normalizedQuery) {
      return base.slice(0, 10)
    }

    return base
      .filter((item) =>
        normalizeKeyword(item.keyword).includes(normalizedQuery)
      )
      .slice(0, 12)
  }, [normalizedQuery, options, selectedIds])

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current) {
        return
      }

      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [])

  function selectSuggestion(id: string) {
    const keyword = optionById.get(id)?.keyword
    if (!keyword) {
      return
    }

    setKeywordText((prev) => replaceActiveKeyword(prev, keyword))
    setOpen(true)
  }

  function addCustomKeyword(raw: string) {
    const label = labelKeyword(raw)
    const normalized = normalizeKeyword(label)
    if (!normalized) {
      return
    }

    setKeywordText((prev) => replaceActiveKeyword(prev, label))
    setOpen(true)
  }

  function removeKeyword(keyword: string) {
    const normalized = normalizeKeyword(keyword)
    setKeywordText((prev) =>
      parseSeoKeywordInput(prev)
        .filter((item) => normalizeKeyword(item) !== normalized)
        .join(", ")
    )
  }

  return (
    <div ref={rootRef} className="space-y-2">
      {selectedIds.map((id) => (
        <input key={id} type="hidden" name="seoKeywordIds" value={id} />
      ))}

      <div className="relative">
        <Input
          id="seoKeywords"
          name="seoKeywords"
          value={keywordText}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setKeywordText(event.target.value)
            setOpen(true)
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              if (canCreateQueryKeyword) {
                addCustomKeyword(query)
                return
              }

              if (suggestions[0]) {
                selectSuggestion(suggestions[0].id)
              }
            }
          }}
          placeholder="Nhập từ khóa SEO, cách nhau bằng dấu phẩy"
        />

        {open ? (
          <div className="absolute z-30 mt-2 w-full rounded-md border bg-popover p-1 shadow-lg">
            {canCreateQueryKeyword ? (
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                onClick={() => addCustomKeyword(query)}
              >
                <Plus className="size-4" />
                <span>
                  Thêm mới <strong>{labelKeyword(query)}</strong>
                </span>
              </button>
            ) : null}

            {suggestions.length > 0 ? (
              <div className="max-h-56 overflow-y-auto">
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                    onClick={() => selectSuggestion(item.id)}
                  >
                    <Check className="size-4 text-muted-foreground" />
                    <span>{item.keyword}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {!canCreateQueryKeyword && suggestions.length === 0 ? (
              <p className="px-2 py-2 text-xs text-muted-foreground">
                Không tìm thấy từ khóa phù hợp.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {selectedOptions.map((item) => (
          <Badge key={item.id} variant="outline" className="gap-1.5 pr-1">
            {item.keyword}
            <button
              type="button"
              className="inline-flex size-4 items-center justify-center rounded-full hover:bg-muted"
              onClick={() => removeKeyword(item.keyword)}
              aria-label={`Bỏ chọn ${item.keyword}`}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        {customKeywords.map((item) => (
          <Badge
            key={`custom-${item}`}
            variant="secondary"
            className="gap-1.5 pr-1"
          >
            {item}
            <button
              type="button"
              className="inline-flex size-4 items-center justify-center rounded-full hover:bg-muted"
              onClick={() => removeKeyword(item)}
              aria-label={`Xóa từ khóa ${item}`}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  )
}
