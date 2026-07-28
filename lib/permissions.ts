import type { EditorialStatus, UserRole } from "@prisma/client"

export const ROLE_LABELS_VI: Record<UserRole, string> = {
  ADMIN: "Quản trị (cũ)",
  USER: "Biên tập viên (cũ)",
  EDITOR_IN_CHIEF: "Tổng biên tập",
  MANAGING_EDITOR: "Thư ký biên tập",
  TEAM_LEAD: "Trưởng nhóm",
  REPORTER_TRANSLATOR: "Phóng viên/Biên dịch",
  CONTRIBUTOR: "Cộng tác viên",
}

export type PermissionAction =
  | "create-category"
  | "edit-category"
  | "delete-category"
  | "moderate-comment"
  | "create-post"
  | "edit-pending-review"
  | "submit-pending-review"
  | "submit-pending-publish"
  | "approve-pending-review"
  | "publish-pending-publish"
  | "edit-pending-publish"
  | "edit-published"
  | "view-all-posts"
  | "delete-any-media"
  | "edit-pen-name"
  | "create-subordinate-account"
  | "delete-post"
  | "pin-post"
  | "manage-products"

export const ACTION_LABELS_VI: Record<PermissionAction, string> = {
  "create-category": "Tạo chuyên mục",
  "edit-category": "Sửa chuyên mục",
  "delete-category": "Xóa chuyên mục",
  "moderate-comment": "Kiểm duyệt bình luận",
  "create-post": "Tạo bài viết",
  "edit-pending-review": "Sửa bài chờ duyệt",
  "submit-pending-review": "Gửi bài chờ duyệt",
  "submit-pending-publish": "Gửi bài chờ xuất bản",
  "approve-pending-review": "Duyệt bài viết",
  "publish-pending-publish": "Xuất bản bài viết",
  "edit-pending-publish": "Sửa bài chờ xuất bản",
  "edit-published": "Sửa bài đã xuất bản",
  "view-all-posts": "Xem tất cả bài viết",
  "delete-any-media": "Xóa media của người khác",
  "edit-pen-name": "Chỉnh sửa bút danh",
  "create-subordinate-account": "Tạo tài khoản cấp dưới",
  "delete-post": "Xóa bài viết",
  "pin-post": "Ghim bài viết tiêu điểm",
  "manage-products": "Quản lý sản phẩm",
}

export const ALL_PERMISSION_ACTIONS: PermissionAction[] = [
  "create-category",
  "edit-category",
  "delete-category",
  "moderate-comment",
  "create-post",
  "edit-pending-review",
  "submit-pending-review",
  "submit-pending-publish",
  "approve-pending-review",
  "publish-pending-publish",
  "edit-pending-publish",
  "edit-published",
  "view-all-posts",
  "delete-any-media",
  "edit-pen-name",
  "create-subordinate-account",
  "delete-post",
  "pin-post",
  "manage-products",
]

export const ALL_EDITABLE_ROLES: UserRole[] = [
  "MANAGING_EDITOR",
  "TEAM_LEAD",
  "REPORTER_TRANSLATOR",
  "CONTRIBUTOR",
]

// Default permission sets – used for seeding and as fallback
export const DEFAULT_PERMISSIONS: Record<UserRole, Set<PermissionAction>> = {
  ADMIN: new Set([
    "create-category",
    "edit-category",
    "delete-category",
    "moderate-comment",
    "create-post",
    "edit-pending-review",
    "submit-pending-review",
    "submit-pending-publish",
    "approve-pending-review",
    "publish-pending-publish",
    "edit-pending-publish",
    "edit-published",
    "view-all-posts",
    "delete-any-media",
    "edit-pen-name",
    "create-subordinate-account",
    "delete-post",
    "pin-post",
    "manage-products",
  ]),
  USER: new Set([
    "create-post",
    "edit-pending-review",
    "submit-pending-review",
    "view-all-posts",
  ]),
  EDITOR_IN_CHIEF: new Set([
    "create-category",
    "edit-category",
    "delete-category",
    "moderate-comment",
    "create-post",
    "edit-pending-review",
    "submit-pending-review",
    "submit-pending-publish",
    "approve-pending-review",
    "publish-pending-publish",
    "edit-pending-publish",
    "edit-published",
    "view-all-posts",
    "delete-any-media",
    "edit-pen-name",
    "create-subordinate-account",
    "delete-post",
    "pin-post",
    "manage-products",
  ]),
  MANAGING_EDITOR: new Set([
    "create-category",
    "edit-category",
    "delete-category",
    "moderate-comment",
    "create-post",
    "edit-pending-review",
    "submit-pending-review",
    "submit-pending-publish",
    "approve-pending-review",
    "publish-pending-publish",
    "edit-pending-publish",
    "edit-published",
    "view-all-posts",
    "delete-any-media",
    "delete-post",
    "pin-post",
  ]),
  TEAM_LEAD: new Set([
    "create-post",
    "edit-pending-review",
    "submit-pending-review",
    "submit-pending-publish",
    "view-all-posts",
  ]),
  REPORTER_TRANSLATOR: new Set([
    "create-post",
    "edit-pending-review",
    "submit-pending-review",
    "view-all-posts",
  ]),
  CONTRIBUTOR: new Set([
    "create-post",
    "submit-pending-review",
    "edit-pending-review",
  ]),
}

// Runtime-mutable permissions map (hydrated from DB on first use)
let _runtimePermissions: Record<UserRole, Set<PermissionAction>> | null = null

function cloneDefaults(): Record<UserRole, Set<PermissionAction>> {
  return {
    ADMIN: new Set(DEFAULT_PERMISSIONS.ADMIN),
    USER: new Set(DEFAULT_PERMISSIONS.USER),
    EDITOR_IN_CHIEF: new Set(DEFAULT_PERMISSIONS.EDITOR_IN_CHIEF),
    MANAGING_EDITOR: new Set(DEFAULT_PERMISSIONS.MANAGING_EDITOR),
    TEAM_LEAD: new Set(DEFAULT_PERMISSIONS.TEAM_LEAD),
    REPORTER_TRANSLATOR: new Set(DEFAULT_PERMISSIONS.REPORTER_TRANSLATOR),
    CONTRIBUTOR: new Set(DEFAULT_PERMISSIONS.CONTRIBUTOR),
  }
}

export function getPermissions(): Record<UserRole, Set<PermissionAction>> {
  if (!_runtimePermissions) {
    _runtimePermissions = cloneDefaults()
  }
  return _runtimePermissions
}

/**
 * Called server-side after loading rows from DB to hydrate the runtime map.
 * rows: array of { role, action } records from the RolePermission table.
 */
export function hydratePermissionsFromDb(rows: Array<{ role: UserRole; action: string }>) {
  const fresh = cloneDefaults()
  // Clear all editable roles first
  for (const role of ALL_EDITABLE_ROLES) {
    fresh[role] = new Set()
  }
  for (const row of rows) {
    if (ALL_PERMISSION_ACTIONS.includes(row.action as PermissionAction)) {
      fresh[row.role]?.add(row.action as PermissionAction)
    }
  }
  _runtimePermissions = fresh
}

/**
 * Update a single role's permissions in the runtime map.
 * Used after saving to DB to keep in-memory state consistent.
 */
export function setRolePermissions(role: UserRole, actions: PermissionAction[]) {
  const perms = getPermissions()
  perms[role] = new Set(actions)
}

export function can(role: UserRole, action: PermissionAction) {
  if (role === "EDITOR_IN_CHIEF" || role === "ADMIN") {
    return true
  }
  return getPermissions()[role].has(action)
}

export function canViewAllPosts(role: UserRole) {
  return can(role, "view-all-posts")
}

export function canPublishNow(role: UserRole) {
  return can(role, "publish-pending-publish")
}

export function canApprovePendingReview(role: UserRole) {
  return can(role, "approve-pending-review")
}

export function canSubmitPendingPublish(role: UserRole) {
  return can(role, "submit-pending-publish")
}

export function canEditByStatus(role: UserRole, status: EditorialStatus) {
  if (status === "DRAFT" || status === "REJECTED" || status === "PENDING_REVIEW") {
    return can(role, "edit-pending-review")
  }

  if (status === "PENDING_PUBLISH") {
    return can(role, "edit-pending-publish")
  }

  return can(role, "edit-published")
}

export function canDeleteAnyMedia(role: UserRole) {
  return can(role, "delete-any-media")
}

export function canEditPenNames(role: UserRole) {
  return can(role, "edit-pen-name")
}

export function canCreateSubordinateAccount(role: UserRole) {
  return can(role, "create-subordinate-account")
}

export function roleCanCreate(role: UserRole, createdRole: UserRole) {
  if (!canCreateSubordinateAccount(role)) {
    return false
  }

  return createdRole !== "EDITOR_IN_CHIEF"
}

export function getAllowedSubmitActions(role: UserRole) {
  const actions: Array<"save-draft" | "submit-review" | "submit-publish" | "publish"> = [
    "save-draft",
    "submit-review",
  ]

  if (canSubmitPendingPublish(role)) {
    actions.push("submit-publish")
  }

  if (canPublishNow(role)) {
    actions.push("publish")
  }

  return actions
}

export function canTrashOrDeletePost(
  role: UserRole,
  authorId: string | null | undefined,
  currentUserId: string,
  status: EditorialStatus
) {
  if (can(role, "delete-post")) {
    return true
  }

  if (authorId === currentUserId && status !== "PUBLISHED" && status !== "PENDING_PUBLISH") {
    return true
  }

  return false
}
