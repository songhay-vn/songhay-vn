"use client"

import { useState, useEffect, useMemo } from "react"
import { MediaPickerProps, PickerTab, MediaAsset } from "./types"
import { LibraryTab } from "./library-tab"
import { UploadTab } from "./upload-tab"
import { LinkTab } from "./link-tab"
import { Library, UploadCloud, Link as LinkIcon, Image as ImageIcon } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

function toSelectionPayload(asset: MediaAsset) {
  return {
    assetType: asset.assetType,
    url: asset.url,
    filename: asset.filename,
    displayName: asset.displayName,
  }
}

export function MediaPicker({
  isOpen,
  onClose,
  onSelect,
  onSelectMany,
  mediaAssets,
  currentUserId,
  allowMultiple = false,
}: MediaPickerProps) {
  const [activeTab, setActiveTab] = useState<PickerTab>("library")
  const [localAssets, setLocalAssets] = useState<MediaAsset[]>(mediaAssets)
  const [selectedAssets, setSelectedAssets] = useState<MediaAsset[]>([])

  useEffect(() => {
    setLocalAssets(mediaAssets)
  }, [mediaAssets])

  useEffect(() => {
    if (isOpen) {
      setActiveTab("library")
      setSelectedAssets([])
    }
  }, [isOpen])

  const selectedAssetIds = useMemo(
    () => selectedAssets.map((asset) => asset.id),
    [selectedAssets]
  )

  function handleSingleSelect(asset: MediaAsset) {
    onSelect(toSelectionPayload(asset))
  }

  function handleToggleSelection(asset: MediaAsset) {
    setSelectedAssets((previous) => {
      const exists = previous.some((item) => item.id === asset.id)
      if (exists) {
        return previous.filter((item) => item.id !== asset.id)
      }
      return [...previous, asset]
    })
  }

  function handleConfirmSelection() {
    if (selectedAssets.length === 0) return

    const payload = selectedAssets.map(toSelectionPayload)

    if (onSelectMany) {
      onSelectMany(payload)
    } else {
      payload.forEach((asset) => onSelect(asset))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] min-h-0 !flex flex-col p-0 gap-0 overflow-hidden sm:max-w-6xl">
        <DialogHeader className="px-6 py-4 border-b bg-zinc-50/50 flex-row items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <DialogTitle className="text-lg font-bold">Thêm Media vào bài viết</DialogTitle>
            <DialogDescription className="text-xs font-medium">
              {allowMultiple
                ? "Chọn nhiều media từ kho, hoặc thêm nhanh một media từ upload hay URL."
                : "Chọn từ kho, tải lên mới hoặc chèn qua URL."}
            </DialogDescription>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PickerTab)} className="flex-1 min-h-0 !flex flex-col">
          <div className="px-2 border-b">
            <TabsList variant="line" className="h-auto p-0 bg-transparent gap-2">
              <TabsTrigger value="library" className="px-6 py-3.5 font-bold data-active:border-b-2 data-active:border-zinc-900 data-active:text-zinc-900 rounded-none transition-none shadow-none">
                <Library className="mr-2 w-4 h-4" />
                Kho media
              </TabsTrigger>
              <TabsTrigger value="upload" className="px-6 py-3.5 font-bold data-active:border-b-2 data-active:border-zinc-900 data-active:text-zinc-900 rounded-none transition-none shadow-none">
                <UploadCloud className="mr-2 w-4 h-4" />
                Tải lên mới
              </TabsTrigger>
              <TabsTrigger value="link" className="px-6 py-3.5 font-bold data-active:border-b-2 data-active:border-zinc-900 data-active:text-zinc-900 rounded-none transition-none shadow-none">
                <LinkIcon className="mr-2 w-4 h-4" />
                Chèn từ Link
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex flex-1 min-h-0 flex-col overflow-hidden relative">
            <TabsContent value="library" className="m-0 flex-1 min-h-0 flex-col overflow-hidden outline-none data-[state=active]:flex data-[state=inactive]:hidden">
              <LibraryTab
                mediaAssets={localAssets}
                currentUserId={currentUserId}
                onSelect={handleSingleSelect}
                selectionMode={allowMultiple ? "multiple" : "single"}
                selectedAssetIds={selectedAssetIds}
                onToggleSelect={handleToggleSelection}
                selectedCount={selectedAssets.length}
                onConfirmSelection={handleConfirmSelection}
                onClearSelection={() => setSelectedAssets([])}
              />
            </TabsContent>
            <TabsContent value="upload" className="m-0 flex-1 min-h-0 flex-col overflow-hidden outline-none data-[state=active]:flex data-[state=inactive]:hidden">
              <UploadTab 
                currentUserId={currentUserId}
                onSelect={(item, fullAsset) => {
                  if (fullAsset) setLocalAssets(prev => [fullAsset, ...prev])
                  onSelect(item)
                }} 
              />
            </TabsContent>
            <TabsContent value="link" className="m-0 flex-1 min-h-0 flex-col overflow-hidden outline-none data-[state=active]:flex data-[state=inactive]:hidden">
              <LinkTab onSelect={onSelect} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
