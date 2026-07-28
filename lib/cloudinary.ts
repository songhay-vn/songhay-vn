import { createHash } from "node:crypto"

type UploadParams = {
  buffer: Buffer
  filename: string
  mimeType: string
  folder?: string
  transformation?: string
}

type UploadResourceType = "image" | "video" | "raw"

type CloudinaryUploadResponse = {
  secure_url?: string
  public_id?: string
  error?: {
    message?: string
  }
}

type CloudinaryDeleteResponse = {
  result?: string
  error?: {
    message?: string
  }
}

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET

  if (!cloudName) {
    throw new Error("Missing CLOUDINARY_CLOUD_NAME")
  }

  if (!uploadPreset && (!apiKey || !apiSecret)) {
    throw new Error("Missing Cloudinary credentials. Set CLOUDINARY_UPLOAD_PRESET or CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET")
  }

  return {
    cloudName,
    apiKey,
    apiSecret,
    uploadPreset,
  }
}

function toSignature(params: Record<string, string | number>, apiSecret: string) {
  const base = Object.entries(params)
    .filter(([, value]) => value !== "" && value !== null && value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&")

  return createHash("sha1")
    .update(`${base}${apiSecret}`)
    .digest("hex")
}

async function uploadAssetToCloudinary({
  buffer,
  filename,
  mimeType,
  folder = "songhay",
  resourceType,
  transformation,
}: UploadParams & { resourceType: UploadResourceType }) {
  const { cloudName, apiKey, apiSecret, uploadPreset } = getCloudinaryConfig()
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`
  const formData = new FormData()
  const fileBytes = new Uint8Array(buffer)

  formData.append("file", new Blob([fileBytes], { type: mimeType }), filename)
  formData.append("folder", folder)

  if (transformation) {
    formData.append("transformation", transformation)
  }

  if (uploadPreset) {
    formData.append("upload_preset", uploadPreset)
  } else {
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = toSignature({
      folder,
      timestamp,
      ...(transformation ? { transformation } : {}),
    }, apiSecret!)
    formData.append("api_key", apiKey!)
    formData.append("timestamp", String(timestamp))
    formData.append("signature", signature)
  }

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  })

  const payload = (await response.json()) as CloudinaryUploadResponse

  if (!response.ok || !payload.secure_url) {
    throw new Error(payload.error?.message || "Cloudinary upload failed")
  }

  return {
    url: payload.secure_url,
    publicId: payload.public_id,
  }
}

export async function uploadImageToCloudinary({ buffer, filename, mimeType, folder = "songhay", transformation }: UploadParams) {
  return uploadAssetToCloudinary({
    buffer,
    filename,
    mimeType,
    folder,
    resourceType: "image",
    transformation,
  })
}

export async function uploadThumbnail(file: File | null) {
  if (!file || file.size === 0) {
    return null
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const result = await uploadImageToCloudinary({
    buffer,
    filename: file.name,
    mimeType: file.type || "image/jpeg",
    folder: "songhay/thumbnails",
    transformation: "c_fill,w_1200,h_720,g_auto",
  })

  return result.url
}

export async function uploadPenNameAvatar(file: File | null) {
  if (!file || file.size === 0) {
    return null
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  return uploadImageToCloudinary({
    buffer,
    filename: file.name,
    mimeType: file.type || "image/jpeg",
    folder: "songhay/pen-names",
    transformation: "c_fill,w_320,h_320,g_face,q_auto:good,f_auto",
  })
}

export async function uploadVideoToCloudinary({ buffer, filename, mimeType, folder = "songhay", transformation }: UploadParams) {
  return uploadAssetToCloudinary({
    buffer,
    filename,
    mimeType,
    folder,
    resourceType: "video",
    transformation,
  })
}

export async function deleteCloudinaryAsset(publicId: string, resourceType: UploadResourceType = "image") {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig()

  if (!apiKey || !apiSecret) {
    console.error("Missing Cloudinary API Key/Secret for deletion")
    return
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const signature = toSignature({
    public_id: publicId,
    timestamp,
  }, apiSecret)

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`
  const formData = new FormData()
  formData.append("public_id", publicId)
  formData.append("api_key", apiKey)
  formData.append("timestamp", String(timestamp))
  formData.append("signature", signature)

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    })

    const payload = (await response.json()) as CloudinaryDeleteResponse

    if (!response.ok || payload.result !== "ok") {
      console.error(`Cloudinary deletion failed for ${publicId}:`, payload.error?.message || payload.result)
    }
  } catch (error) {
    console.error(`Error deleting Cloudinary asset ${publicId}:`, error)
  }
}

export function extractCloudinaryPublicId(url: string): string | null {
  if (!url || typeof url !== "string" || !url.includes("/upload/")) {
    return null
  }
  const parts = url.split("/upload/")[1]?.split("/")
  if (!parts || parts.length === 0) {
    return null
  }
  const filtered = parts.filter((p) => !p.includes(",") && !/^v\d+$/.test(p))
  if (filtered.length === 0) {
    return null
  }
  const fullPath = filtered.join("/")
  return fullPath.replace(/\.[^/.]+$/, "")
}
