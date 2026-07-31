"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { clearDataCache } from "@/lib/data-cache"
import { prisma } from "@/lib/prisma"
import { requireActionPermission, revalidatePost } from "@/app/admin/actions-helpers"

export async function moderateComment(formData: FormData) {
  await requireActionPermission("moderate-comment", "/admin?tab=comments&toast=post_action_forbidden")

  const commentId = String(formData.get("commentId") || "")
  const action = String(formData.get("action") || "")

  if (!commentId || !["approve", "delete"].includes(action)) {
    redirect("/admin?tab=comments&toast=comment_action_failed")
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { post: { select: { slug: true, category: { select: { slug: true } } } } },
  })

  if (action === "approve") {
    await prisma.comment.update({ where: { id: commentId }, data: { isApproved: true } })
  }

  if (action === "delete") {
    await prisma.comment.delete({ where: { id: commentId } })
  }

  if (comment?.post) {
    await revalidatePost(comment.post.slug, comment.post.category?.slug, {
      isVisibilityChange: false,
    })
  }
  
  revalidatePath("/admin")
  clearDataCache()
  redirect(`/admin?tab=comments&toast=${action === "approve" ? "comment_approved" : "comment_deleted"}`)
}
