"use client"

import { useEffect } from "react"

type ViewTrackerProps = {
  postId: string
}

export function ViewTracker({ postId }: ViewTrackerProps) {
  useEffect(() => {
    void fetch(`/api/posts/${postId}/view`, { method: "POST" })
  }, [postId])

  return null
}
