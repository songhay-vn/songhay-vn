"use client"

import { FormEvent, useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

type CommentFormProps = {
  postId: string
  currentUser: {
    id: string
    name: string
  } | null
}

export function CommentForm({ postId, currentUser }: CommentFormProps) {
  const [authorName, setAuthorName] = useState(currentUser?.name || "")
  const [content, setContent] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")



  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setStatus("loading")

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, authorName, content }),
      })

      if (!response.ok) {
        throw new Error("Không thể gửi bình luận")
      }

      const payload = (await response.json()) as { requiresModeration?: boolean }

      setContent("")
      setStatus("success")
      toast.success("Đã gửi bình luận", {
        description: payload.requiresModeration
          ? "Bình luận có chứa từ cần kiểm duyệt và đang chờ admin duyệt."
          : "Bình luận sạch đã được hiển thị ngay. Cảm ơn bạn đã chia sẻ ý kiến.",
      })
    } catch {
      setStatus("error")
      toast.error("Gửi bình luận thất bại", {
        description: "Vui lòng thử lại sau ít phút.",
      })
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 border border-zinc-200 bg-white p-4">
      <h3 className="text-xl font-bold">Bình luận</h3>
      <input
        value={authorName}
        onChange={(event) => setAuthorName(event.target.value)}
        placeholder="Tên hiển thị"
        className="h-10 w-full border border-zinc-300 px-3 py-2"
        minLength={2}
        maxLength={80}
        required
      />
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Nội dung bình luận"
        className="h-28 w-full border border-zinc-300 px-3 py-2"
        required
      />
      <Button type="submit" className="rounded-none bg-rose-600 text-white hover:bg-rose-700" disabled={status === "loading"}>
        {status === "loading" ? "Đang gửi..." : "Gửi bình luận"}
      </Button>
    </form>
  )
}
