import { Prisma } from "@prisma/client"

export type PostFull = Prisma.PostGetPayload<{
  include: {
    category: true
    comments: {
      where: { isApproved: true }
    }
  }
}>

export type PostCompact = {
  id: string
  title: string
  slug: string
  thumbnailUrl: string | null
  excerpt: string
  publishedAt: Date | null
  category: {
    name: string
    slug: string
  }
  _count: {
    comments: number
  }
}

export type PostListItem = PostCompact

export type PostWithCategoryAndComments = PostListItem

export type PostWithCategory = Prisma.PostGetPayload<{
  include: {
    category: true
  }
}>
