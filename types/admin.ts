import type { UserRole } from "@prisma/client"

export type AdminTab =
  | "overview"
  | "write"
  | "media-library"
  | "personal-archive"
  | "history"
  | "categories"
  | "comments"
  | "posts"
  | "trash"
  | "settings-password"
  | "settings-moderation"
  | "settings-pen-names"
  | "settings-permissions"
  | "settings-users"
  | "redirects"
  | "products"

export type PostsFilters = {
  query: string
  authorId: string
  status: "all" | "draft" | "pending-review" | "pending-publish" | "published" | "rejected"
  approval: "all" | "approved" | "unapproved"
  categoryId: string
  fromDate: string
  toDate: string
  requestedPage?: number
}

export type PersonalArchiveFilters = {
  query: string
  status: "all" | "draft" | "pending" | "pending-publish" | "published" | "rejected"
  fromDate: string
  toDate: string
  requestedPage?: number
}

export type TrashFilters = {
  query: string
  authorId: string
  fromDate: string
  toDate: string
  requestedPage?: number
}

export type AdminCurrentUser = {
  id: string
  role: UserRole
}

export type UserRow = {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: Date
}

export type GetAdminPageDataInput = {
  activeTab: AdminTab
  overviewRange: "30d"
  postsFilters: PostsFilters
  personalArchiveFilters: PersonalArchiveFilters
  trashFilters: TrashFilters
  historyPage: number
  currentUser: AdminCurrentUser
}
