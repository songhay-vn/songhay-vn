"use client"

import Image from "next/image"
import { useState } from "react"
import { Link2, Globe, Image as ImageIcon, Video as VideoIcon, CheckCircle2, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

type LinkTabProps = {
  onSelect: (asset: { assetType: "IMAGE" | "VIDEO"; url: string; filename: string; displayName: string | null }) => void
}

export function LinkTab({ onSelect }: LinkTabProps) {
  const [url, setUrl] = useState("")
  const [assetType, setAssetType] = useState<"IMAGE" | "VIDEO">("IMAGE")
  const [error, setError] = useState<string | null>(null)

  function handleInsert() {
    if (!url.trim()) {
      setError("Vui lòng nhập URL của tệp media.")
      return
    }

    try {
      new URL(url)
    } catch {
      setError("URL không hợp lệ, vui lòng kiểm tra lại.")
      return
    }

    onSelect({
      assetType,
      url: url.trim(),
      filename: "external-link",
      displayName: "Media từ URL",
    })
  }

  return (
    <div className="p-8 flex flex-col items-center justify-start min-h-[40vh] space-y-8 bg-white flex-1 relative overflow-auto">
      <div className="w-full max-w-md space-y-6 pt-4">
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-bold flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              Đường dẫn Media (URL)
            </Label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 z-10" />
                <Input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="h-9 pl-9 rounded-md"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <p className="text-[10px] text-muted-foreground font-medium px-1">Chèn ảnh hoặc video từ các nguồn bên ngoài (Cloudinary, Imgur, v.v.)</p>
            </div>
            {url && (
              <div className="relative w-full aspect-video overflow-hidden bg-zinc-50 flex items-center justify-center border border-zinc-200 rounded-md mt-3">
                {assetType === "VIDEO" ? (
                  <video src={url} className="max-h-full max-w-full object-contain" controls />
                ) : (
                  <Image src={url} alt="Preview" width={800} height={450} className="max-h-full max-w-full object-contain" />
                )}
              </div>
            )}
            
            <div className="space-y-4 pt-2">
            <Label className="text-sm font-bold">Loại Media</Label>
            <RadioGroup
              value={assetType}
              onValueChange={(v) => setAssetType(v as "IMAGE" | "VIDEO")}
              className="grid grid-cols-2 gap-4"
            >
              <Label
                htmlFor="type-image"
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-md border p-4 cursor-pointer transition-colors hover:bg-muted/50",
                  assetType === "IMAGE" ? "border-zinc-900 bg-zinc-50" : "border-zinc-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="IMAGE" id="type-image" />
                  <div className="flex items-center gap-2 font-bold">
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    Ảnh
                  </div>
                </div>
              </Label>
              <Label
                htmlFor="type-video"
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-md border p-4 cursor-pointer transition-colors hover:bg-muted/50",
                  assetType === "VIDEO" ? "border-zinc-900 bg-zinc-50" : "border-zinc-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="VIDEO" id="type-video" />
                  <div className="flex items-center gap-2 font-bold">
                    <VideoIcon className="w-4 h-4 text-muted-foreground" />
                    Video
                  </div>
                </div>
              </Label>
            </RadioGroup>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="py-3">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription className="text-xs font-bold">{error}</AlertDescription>
          </Alert>
        )}

        <Button
          type="button"
          onClick={handleInsert}
          className="w-full h-10 rounded-md font-semibold text-sm mt-4"
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Xác nhận chèn vào nội dung
        </Button>
      </div>
    </div>
  )
}
