"use client"

import Image from "next/image"
import { useState, useMemo, useEffect } from "react"
import { UploadCloud, AlertCircle, CheckCircle2, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { MediaAsset } from "./types"

type UploadTabProps = {
  onSelect: (
    asset: { assetType: "IMAGE" | "VIDEO"; url: string; filename: string; displayName: string | null },
    fullAsset?: MediaAsset
  ) => void
  submitText?: string
  currentUserId?: string
  hideSaveToLibrary?: boolean
}

export function UploadTab({
  onSelect,
  submitText = "Xác nhận tải lên và chèn",
  currentUserId,
  hideSaveToLibrary = false,
}: UploadTabProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveToLibrary, setSaveToLibrary] = useState(true)
  const shouldSaveToLibrary = hideSaveToLibrary ? true : saveToLibrary

  const previews = useMemo(() => {
    return files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }))
  }, [files])

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url))
    }
  }, [previews])

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleUpload() {
    if (files.length === 0) return

    setIsUploading(true)
    setError(null)

    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("skipLibrary", String(!shouldSaveToLibrary))

        const endpoint = file.type.startsWith("video/") ? "/api/uploads/video" : "/api/uploads/image"

        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || `Upload failed for ${file.name}`)
        }

        const data = await response.json()
        const assetType = file.type.startsWith("video/") ? "VIDEO" as const : "IMAGE" as const
        
        const fullAsset: MediaAsset = {
          id: data.asset?.id || `temp-${Date.now()}-${Math.random()}`,
          assetType,
          visibility: "SHARED",
          url: data.url,
          filename: file.name,
          displayName: null,
          uploader: { id: currentUserId || "me", name: "Tôi" }
        }

        onSelect({
          assetType,
          url: data.url,
          filename: file.name,
          displayName: null,
        }, fullAsset)
      }
      setFiles([])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra khi upload.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 bg-white min-h-0 overflow-hidden">
      {/* Scrollable area for the main content */}
      <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-start sm:justify-center">
        <div className="w-full max-w-2xl space-y-6">
          <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-8 text-center hover:border-zinc-400 hover:bg-zinc-50/50 transition-all relative group">
            <input
              type="file"
              multiple
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              onChange={(e) => {
                 if (e.target.files && e.target.files.length > 0) {
                   const newFiles = Array.from(e.target.files)
                   setFiles((prev) => [...prev, ...newFiles])
                 }
                 e.target.value = ""
              }}
              accept="image/gif,image/png,image/jpeg,image/webp,image/avif,video/*"
            />
            <div className="space-y-4 pointer-events-none">
              <div className="mx-auto w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:text-zinc-900 group-hover:bg-zinc-100 transition-all shadow-sm">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-bold text-zinc-900 px-4">
                  Kéo thả nhiều tệp hoặc nhấp để chọn
                </p>
                <p className="text-xs text-zinc-400 font-medium">Hỗ trợ GIF, PNG, JPG, WEBP, AVIF và Video (Tối đa 200MB/tệp)</p>
              </div>
            </div>
          </div>

          {files.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[30vh] overflow-y-auto p-1">
              {previews.map((p, i) => (
                <div key={i} className="relative aspect-video overflow-hidden bg-zinc-100 border shadow-sm group">
                  {p.file.type.startsWith("video/") ? (
                    <video src={p.url} className="w-full h-full object-cover" />
                  ) : (
                    <Image src={p.url} alt={p.file.name} fill className="object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-[10px] text-white truncate font-medium">
                    {p.file.name}
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="py-3">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-xs font-bold">{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Sticky footer for checkbox and confirm button */}
      <div className="border-t border-zinc-100 bg-zinc-50/50 px-6 py-4 flex flex-col items-center">
        <div className="w-full max-w-2xl space-y-4">
          {!hideSaveToLibrary ? (
            <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3">
              <Checkbox
                id="save-to-library"
                checked={shouldSaveToLibrary}
                onCheckedChange={(checked) => setSaveToLibrary(checked === true)}
              />
              <Label htmlFor="save-to-library" className="cursor-pointer text-sm font-medium text-zinc-700">
                Lưu vào kho media dùng chung
              </Label>
            </div>
          ) : null}

          <Button
            type="button"
            disabled={files.length === 0 || isUploading}
            onClick={handleUpload}
            className="w-full h-12 rounded-xl font-bold shadow-md transition-all"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xử lý {files.length} tệp...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {submitText} ({files.length})
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
