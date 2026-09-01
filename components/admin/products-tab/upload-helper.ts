export async function uploadSingleFile(file: File): Promise<{ url: string; publicId: string }> {
  const fd = new FormData()
  fd.append("file", file)
  fd.append("skipLibrary", "true")

  const res = await fetch("/api/uploads/image", { method: "POST", body: fd })
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    const serverMsg = errData.error || `HTTP ${res.status}`
    throw new Error(`Upload failed: ${serverMsg}`)
  }

  const data = await res.json()
  return { url: data.url, publicId: data.asset?.publicId ?? "" }
}
