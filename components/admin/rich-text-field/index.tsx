"use client"

import { useMemo, useState, useRef } from "react"
import dynamic from "next/dynamic"
import { EditorMode, RichTextFieldProps } from "./types"

const CKEditorWrapper = dynamic(
  () => import("./ck-editor-wrapper").then((mod) => mod.CKEditorWrapper),
  { ssr: false }
)

const MonacoEditorWrapper = dynamic(
  () => import("./monaco-editor-wrapper").then((mod) => mod.MonacoEditorWrapper),
  { ssr: false }
)
import { MediaPicker } from "../media-picker"
import { Plus, FileText, Code as CodeIcon, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

function toPlainText(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

type EditorDataProcessor = {
  toView: (html: string) => unknown
}

type EditorDataApi = {
  processor: EditorDataProcessor
  toModel: (viewFragment: unknown) => unknown
}

type EditorModelApi = {
  change: (callback: () => void) => void
  insertContent: (fragment: unknown) => void
}

type EditorLike = {
  data: EditorDataApi
  model: EditorModelApi
  getData: () => string
}

export function RichTextField({
  name,
  placeholder = "Nhập nội dung bài viết...",
  defaultValue = "",
  mediaAssets = [],
  currentUserId,
  className,
}: RichTextFieldProps) {
  const [mode, setMode] = useState<EditorMode>("classic")
  const [html, setHtml] = useState(defaultValue)
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const editorRef = useRef<EditorLike | null>(null)

  const isEmpty = useMemo(() => toPlainText(html).length === 0, [html])

  function buildMediaSnippet(asset: { assetType: "IMAGE" | "VIDEO"; url: string }, imageCount: number, videoCount: number) {
    const caption = asset.assetType === "IMAGE" ? `Ảnh ${imageCount}.` : `Video ${videoCount}.`
    return asset.assetType === "IMAGE"
      ? `\n<figure class="image image-style-align-center" style="display: table; margin: 2em auto; text-align: center;">\n  <img src="${asset.url}" alt="${caption}" loading="lazy" />\n  <figcaption>${caption}</figcaption>\n</figure>\n<p>&nbsp;</p>\n`
      : `\n<div class="video-wrap" style="text-align: center; margin: 2em auto;">\n  <video controls src="${asset.url}" title="${caption}" style="max-width: 100%; height: auto; display: inline-block;"></video>\n  <div class="video-caption" style="margin-top: 0.3em; font-size: 0.9em; color: #6b7280; font-style: italic; text-align: center;">${caption}</div>\n</div>\n<p>&nbsp;</p>\n`
  }

  function insertMediaBatch(assets: Array<{ assetType: "IMAGE" | "VIDEO"; url: string; filename: string; displayName: string | null }>) {
    let currentImgCount = (html.match(/<img /gi) || []).length
    let currentVideoCount = (html.match(/<video /gi) || []).length

    const snippet = assets.map((asset) => {
      if (asset.assetType === "IMAGE") {
        currentImgCount += 1
      } else {
        currentVideoCount += 1
      }

      return buildMediaSnippet(asset, currentImgCount, currentVideoCount)
    }).join("")

    if (mode === "classic" && editorRef.current) {
      const editor = editorRef.current
      const viewFragment = editor.data.processor.toView(snippet)
      const modelFragment = editor.data.toModel(viewFragment)
      editor.model.change(() => {
        editor.model.insertContent(modelFragment)
      })
      setHtml(editor.getData())
    } else {
      setHtml((previous) => `${previous}${snippet}`)
    }
    setShowMediaPicker(false)
  }

  function insertMedia(asset: { assetType: "IMAGE" | "VIDEO"; url: string; filename: string; displayName: string | null }) {
    insertMediaBatch([asset])
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name={name} value={html} />
      <div className={cn("overflow-hidden rounded-md border border-zinc-200 bg-white", className)}>
        <div className="flex flex-row items-center justify-between px-3 py-1.5 border-b border-zinc-200 bg-zinc-50/50">
          <Tabs value={mode} onValueChange={(v) => setMode(v as EditorMode)} className="w-auto">
            <TabsList variant="line" className="h-8 bg-transparent p-0 border-0">
              <TabsTrigger value="classic" className="px-3 py-1.5 text-xs font-bold data-active:text-primary data-[variant=line]:data-active:after:-bottom-1.5">
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                Trình soạn thảo
              </TabsTrigger>
              <TabsTrigger value="code" className="px-3 py-1.5 text-xs font-bold data-active:text-primary data-[variant=line]:data-active:after:-bottom-1.5">
                <CodeIcon className="mr-1.5 h-3.5 w-3.5" />
                Mã HTML
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => setShowMediaPicker(true)}
            className="h-7 text-xs font-bold bg-zinc-900 text-white"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Thêm media
          </Button>
        </div>

        <div className="bg-white">
          {mode === "classic" ? (
            <CKEditorWrapper
              data={html}
              onChange={setHtml}
              placeholder={placeholder}
              onReady={(editor) => { editorRef.current = editor as EditorLike }}
            />
          ) : (
            <MonacoEditorWrapper
              value={html}
              onChange={setHtml}
            />
          )}
        </div>
      </div>

      <MediaPicker
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={insertMedia}
        onSelectMany={insertMediaBatch}
        mediaAssets={mediaAssets}
        currentUserId={currentUserId}
        allowMultiple
      />

      {isEmpty && (
        <Alert variant="default" className="border-amber-200 bg-amber-50/50 text-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="font-semibold italic">
            Lưu ý: Nội dung bài viết hiện đang trống.
          </AlertDescription>
        </Alert>
      )}

      <style jsx global>{`
        .ck-full-editor .ck.ck-toolbar {
          border-left: 0;
          border-right: 0;
          border-top: 0;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb !important;
        }

        .ck-full-editor .ck.ck-editor__main > .ck-editor__editable {
          min-height: 600px;
          padding: 32px 40px;
          font-size: 17px;
          line-height: 1.8;
          color: #111827;
          resize: vertical;
          overflow-y: auto;
          overflow-x: hidden;
          word-break: break-word;
          overflow-wrap: break-word;
        }

        .ck-content figure.image {
          margin: 2em auto;
        }

        .ck-content figure.image img {
          max-width: 100%;
          border-radius: 4px;
        }

        .ck-content figure.image figcaption {
          margin-top: 0.3em;
          font-size: 0.9em;
          color: #6b7280;
          font-style: italic;
          text-align: center;
        }

        .ck-content .video-caption {
          margin-top: 0.3em;
          font-size: 0.9em;
          color: #6b7280;
          font-style: italic;
          text-align: center;
        }
      `}</style>
    </div>
  )
}
