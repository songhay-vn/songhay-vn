"use client"


import { useState, useMemo, useEffect } from "react"
import { UploadCloud, AlertCircle, CheckCircle2, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Attachment,
  AttachmentGroup,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment"
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
          <div className="border-2 border-dashed border-zinc-200 rounded-md p-6 text-center hover:border-zinc-400 hover:bg-zinc-50/50 transition-colors relative group">
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
            <div className="space-y-3 pointer-events-none">
              <div className="mx-auto w-12 h-12 bg-zinc-100 rounded-md flex items-center justify-center text-zinc-500 group-hover:text-zinc-900 group-hover:bg-zinc-200 transition-colors">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-zinc-900 px-4">
                  Kéo thả nhiều tệp hoặc nhấp để chọn
                </p>
                <p className="text-xs text-zinc-500 font-medium">Hỗ trợ GIF, PNG, JPG, WEBP, AVIF và Video (Tối đa 200MB/tệp)</p>
              </div>
            </div>
          </div>

          {files.length > 0 && (
            <AttachmentGroup className="w-full">
              {previews.map((p, i) => (
                <Attachment key={i} className="min-w-64 max-w-72 shrink-0 rounded-md">
                  <AttachmentMedia variant="image">
                    {p.file.type.startsWith("video/") ? (
                      <video src={p.url} className="w-full h-full object-cover" />
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={p.url} alt={p.file.name} className="w-full h-full object-cover" />
                    )}
                  </AttachmentMedia>
                  <AttachmentContent>
                    <AttachmentTitle>{p.file.name}</AttachmentTitle>
                    <AttachmentDescription>
                      {(p.file.size / 1024 / 1024).toFixed(2)} MB
                    </AttachmentDescription>
                  </AttachmentContent>
                  <AttachmentActions>
                    <AttachmentAction aria-label={`Remove ${p.file.name}`} onClick={() => removeFile(i)}>
                      <X />
                    </AttachmentAction>
                  </AttachmentActions>
                </Attachment>
              ))}
            </AttachmentGroup>
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
      <div className="border-t border-zinc-200 bg-white px-6 py-4 flex flex-col items-center">
        <div className="w-full max-w-2xl space-y-3">
          {!hideSaveToLibrary ? (
            <div className="flex items-center gap-3 rounded-md border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5">
              <Checkbox
                id="save-to-library"
                checked={shouldSaveToLibrary}
                onCheckedChange={(checked) => setSaveToLibrary(checked === true)}
              />
              <Label htmlFor="save-to-library" className="cursor-pointer text-sm font-medium text-zinc-800">
                Lưu vào kho media dùng chung
              </Label>
            </div>
          ) : null}

          <Button
            type="button"
            disabled={files.length === 0 || isUploading}
            onClick={handleUpload}
            className="w-full h-10 rounded-md font-semibold text-sm"
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
