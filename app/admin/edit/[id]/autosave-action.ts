"use server"

import { prisma } from "@/lib/prisma"
import { requireCmsUser } from "@/lib/auth"
import { canEditByStatus } from "@/lib/permissions"

export async function autosaveDraftAction(postId: string, data: { title: string; excerpt: string; content: string }) {
  const currentUser = await requireCmsUser()
  const currentPost = await prisma.post.findUnique({ where: { id: postId } })
  
  if (!currentPost) return { error: "not_found" }
  if (!canEditByStatus(currentUser.role, currentPost.editorialStatus)) return { error: "forbidden" }

  await prisma.post.update({
    where: { id: postId },
    data: {
      title: data.title || currentPost.title,
      excerpt: data.excerpt || currentPost.excerpt,
      content: data.content || currentPost.content,
      // Only set to DRAFT if it was a DRAFT, otherwise keep current status
      // (Autosave should not unpublish a live article)
      editorialStatus: currentPost.editorialStatus === "DRAFT" ? "DRAFT" : currentPost.editorialStatus,
      isDraft: currentPost.editorialStatus === "DRAFT",
      isPublished: currentPost.isPublished,
      lastEditorId: currentUser.id,
      updatedAt: new Date()
    }
  })
  
  return { success: true, timestamp: new Date().toISOString() }
}
