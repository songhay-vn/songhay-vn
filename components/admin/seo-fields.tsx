"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

import { buildAutoSeoDescription, buildAutoSeoTitle } from "@/lib/post-seo"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type SeoFieldsProps = {
  defaultSeoTitle?: string | null
  defaultSeoDescription?: string | null
  defaultCanonicalUrl?: string | null
  initialTitle?: string | null
  initialExcerpt?: string | null
  initialContent?: string | null
  children?: ReactNode
}

function readFieldValue(form: HTMLFormElement, name: string) {
  const field = form.elements.namedItem(name)
  if (
    field instanceof HTMLInputElement ||
    field instanceof HTMLTextAreaElement
  ) {
    return field.value
  }

  return ""
}

export function SeoFields({
  defaultSeoTitle = "",
  defaultSeoDescription = "",
  defaultCanonicalUrl = "",
  initialTitle = "",
  initialExcerpt = "",
  initialContent = "",
  children,
}: SeoFieldsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [fallbackSeoTitle, setFallbackSeoTitle] = useState(() =>
    buildAutoSeoTitle({ title: initialTitle })
  )
  const [fallbackSeoDescription, setFallbackSeoDescription] = useState(() =>
    buildAutoSeoDescription({
      title: initialTitle,
      excerpt: initialExcerpt,
      content: initialContent,
    })
  )

  useEffect(() => {
    const form = containerRef.current?.closest("form")
    if (!form) {
      return
    }

    const updateFallbacks = () => {
      const title = readFieldValue(form, "title") || initialTitle
      const excerpt = readFieldValue(form, "excerpt") || initialExcerpt
      const content = readFieldValue(form, "content") || initialContent

      setFallbackSeoTitle(buildAutoSeoTitle({ title }))
      setFallbackSeoDescription(
        buildAutoSeoDescription({
          title,
          excerpt,
          content,
        })
      )
    }

    updateFallbacks()
    form.addEventListener("input", updateFallbacks)
    form.addEventListener("change", updateFallbacks)

    return () => {
      form.removeEventListener("input", updateFallbacks)
      form.removeEventListener("change", updateFallbacks)
    }
  }, [initialContent, initialExcerpt, initialTitle])

  return (
    <div ref={containerRef} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="seoTitle" className="text-xs text-zinc-700 font-semibold">Tiêu đề SEO</Label>
        <Input
          id="seoTitle"
          name="seoTitle"
          defaultValue={defaultSeoTitle || ""}
          className="text-xs"
          placeholder={
            fallbackSeoTitle || "Hệ thống sẽ tự tạo từ tiêu đề bài viết"
          }
        />
        <p className="text-[11px] text-zinc-500">
          Để trống, hệ thống sẽ tự tạo từ tiêu đề bài viết.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="seoDescription" className="text-xs text-zinc-700 font-semibold">Mô tả SEO</Label>
        <Textarea
          id="seoDescription"
          name="seoDescription"
          defaultValue={defaultSeoDescription || ""}
          className="min-h-16 text-xs"
          placeholder={
            fallbackSeoDescription || "Hệ thống sẽ tự tạo từ trích dẫn bài viết"
          }
        />
        <p className="text-[11px] text-zinc-500">
          Để trống, hệ thống sẽ tự tạo từ trích dẫn hoặc nội dung.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="seoKeywords" className="text-xs text-zinc-700 font-semibold">Từ khóa SEO</Label>
        {children}
      </div>
      <div className="space-y-1.5 pt-1">
        <Label htmlFor="canonicalUrl" className="text-xs text-zinc-700 font-semibold">Canonical URL (Tuỳ chọn)</Label>
        <Input
          id="canonicalUrl"
          name="canonicalUrl"
          defaultValue={defaultCanonicalUrl || ""}
          className="text-xs"
          placeholder="https://example.com/original-post"
        />
        <p className="text-[11px] text-zinc-500">
          Dùng khi copy bài từ nguồn khác để tránh lỗi trùng lặp nội dung.
        </p>
      </div>
    </div>
  )
}
