"use client"

import { useEffect } from "react"
import { autosaveDraftAction } from "@/app/admin/edit/[id]/autosave-action"

const WRITE_FORM_TRACKED_FIELDS = new Set([
  "title",
  "penNameId",
  "excerpt",
  "content",
  "mainCategoryId",
  "subcategoryId",
  "thumbnailUrl",
  "thumbnailUpload",
  "videoEmbedUrl",
  "seoTitle",
  "seoDescription",
  "seoKeywordIds",
  "seoKeywords",
  "canonicalUrl",
  "scheduledPublishAt",
  "isSensitive",
  "hasVideo",
  "isFeatured",
  "isTrending",
])

function normalizeEntryValue(value: FormDataEntryValue) {
  if (value instanceof File) {
    return value.size > 0 ? value.name.trim() : ""
  }

  return String(value || "").trim()
}

function getMeaningfulTextFromEditorHtml(value: string) {
  const container = document.createElement("div")
  container.innerHTML = value
  container
    .querySelectorAll("figure, figcaption, img, video, iframe, picture, source, .video-wrap, .video-caption")
    .forEach((node) => node.remove())

  return (container.textContent || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function hasWriteFormChanges(form: HTMLFormElement) {
  const formData = new FormData(form)

  for (const [key, rawValue] of formData.entries()) {
    if (!WRITE_FORM_TRACKED_FIELDS.has(key)) {
      continue
    }

    const value = normalizeEntryValue(rawValue)
    if (!value) {
      continue
    }

    if (key === "content") {
      if (getMeaningfulTextFromEditorHtml(value)) {
        return true
      }
      continue
    }

    return true
  }

  return false
}

export function EditFormDirtyTracker({ postId }: { postId?: string }) {
  useEffect(() => {
    let isDirty = false

    const handleMarkDirty = () => {
      if (postId) {
        isDirty = true
        return
      }

      const form = document.querySelector("form")
      if (!form) {
        isDirty = false
        return
      }

      isDirty = hasWriteFormChanges(form as HTMLFormElement)
    }

    const handleFormSubmit = () => {
      isDirty = false
    }

    const form = document.querySelector("form")
    if (form) {
      // Use capture true to catch all input/change events even if they stop propagation
      form.addEventListener("input", handleMarkDirty, true)
      form.addEventListener("change", handleMarkDirty, true)
      form.addEventListener("submit", handleFormSubmit)
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    const handleGlobalClick = (e: MouseEvent) => {
      if (!isDirty) return
      
      const target = e.target as HTMLElement
      const link = target.closest("a")
      
      // Prevent soft navigation via Next.js <Link> if dirty
      if (link && link.href && link.target !== "_blank") {
        if (!window.confirm("Bạn có nội dung chưa lưu. Bạn có chắc chắn muốn rời đi?")) {
           e.preventDefault()
           e.stopPropagation()
        }
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    document.addEventListener("click", handleGlobalClick, { capture: true })

    const autosaveInterval = setInterval(async () => {
      if (isDirty && postId && form) {
        isDirty = false // Optimistically reset. Typing during request resets it to true.
        try {
          const formData = new FormData(form)
          const title = String(formData.get("title") || "")
          const excerpt = String(formData.get("excerpt") || "")
          const content = String(formData.get("content") || "")

          const result = await autosaveDraftAction(postId, { title, excerpt, content })
          if (result.error) {
            console.error("Autosave failed", result.error)
            isDirty = true
          } else {
            console.log("Autosave successful at", result.timestamp)
          }
        } catch (e) {
          console.error("Autosave failed", e)
          isDirty = true
        }
      }
    }, 20000) // 20 seconds cooldown

    return () => {
      clearInterval(autosaveInterval)
      if (form) {
        form.removeEventListener("input", handleMarkDirty, true)
        form.removeEventListener("change", handleMarkDirty, true)
        form.removeEventListener("submit", handleFormSubmit)
      }
      window.removeEventListener("beforeunload", handleBeforeUnload)
      document.removeEventListener("click", handleGlobalClick, { capture: true })
    }
  }, [postId])

  return null
}
