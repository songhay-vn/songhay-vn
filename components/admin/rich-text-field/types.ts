export type MediaAsset = {
  id: string
  assetType: "IMAGE" | "VIDEO"
  visibility: "PRIVATE" | "SHARED"
  url: string
  displayName: string | null
  filename: string
  uploader?: {
    id: string
    name: string
    email?: string
  }
}

export type RichTextFieldProps = {
  name: string
  placeholder?: string
  defaultValue?: string
  mediaAssets?: MediaAsset[]
  currentUserId?: string
  className?: string
}

export type EditorMode = "classic" | "code"
