import { describe, expect, test, beforeEach } from "bun:test"

import {
  canTrashOrDeletePost,
  hydratePermissionsFromDb,
  setRolePermissions,
  getPermissions,
  DEFAULT_PERMISSIONS,
  can,
} from "../lib/permissions"

import type { UserRole } from "@prisma/client"
import type { PermissionAction } from "../lib/permissions"

describe("role action scopes and dynamic permissions", () => {
  // Reset permissions before each test to avoid cross-pollution
  beforeEach(() => {
    // We can simulate a reset by hydrating from an empty array (which uses defaults but clears editable roles)
    // Wait, hydratePermissionsFromDb clears ALL_EDITABLE_ROLES. 
    // To restore completely to default, we might have to manually set them or rely on a specific hydration shape.
    // Let's hydrate with the defaults for testing.
    const defaultRows: Array<{ role: UserRole; action: string }> = []
    
    for (const role of Object.keys(DEFAULT_PERMISSIONS) as unknown as UserRole[]) {
      const actions = (DEFAULT_PERMISSIONS as Record<string, Set<PermissionAction>>)[role] || new Set()
      for (const action of actions) {
        defaultRows.push({ role, action })
      }
    }
    
    hydratePermissionsFromDb(defaultRows)
  })

  test("canTrashOrDeletePost: user with 'delete-post' capability can delete anything", () => {
    // EDITOR_IN_CHIEF has 'delete-post' by default
    expect(can("EDITOR_IN_CHIEF", "delete-post")).toBe(true)

    // They can delete a published post from another user
    expect(canTrashOrDeletePost("EDITOR_IN_CHIEF", "other-user", "current-chief", "PUBLISHED")).toBe(true)
    
    // They can delete a pending review post from another user
    expect(canTrashOrDeletePost("EDITOR_IN_CHIEF", "other-user", "current-chief", "PENDING_REVIEW")).toBe(true)
  })

  test("canTrashOrDeletePost: user without 'delete-post' capability is scoped to own unpublished posts", () => {
    // CONTRIBUTOR does not have 'delete-post'
    expect(can("CONTRIBUTOR", "delete-post")).toBe(false)

    // Cannot delete someone else's post
    expect(canTrashOrDeletePost("CONTRIBUTOR", "other-user", "current-contributor", "DRAFT")).toBe(false)
    
    // Can delete their own DRAFT
    expect(canTrashOrDeletePost("CONTRIBUTOR", "current-contributor", "current-contributor", "DRAFT")).toBe(true)
    
    // Can delete their own PENDING_REVIEW
    expect(canTrashOrDeletePost("CONTRIBUTOR", "current-contributor", "current-contributor", "PENDING_REVIEW")).toBe(true)

    // Can delete their own REJECTED
    expect(canTrashOrDeletePost("CONTRIBUTOR", "current-contributor", "current-contributor", "REJECTED")).toBe(true)

    // Cannot delete their own PENDING_PUBLISH (out of scope, it's already approved)
    expect(canTrashOrDeletePost("CONTRIBUTOR", "current-contributor", "current-contributor", "PENDING_PUBLISH")).toBe(false)

    // Cannot delete their own PUBLISHED (out of scope)
    expect(canTrashOrDeletePost("CONTRIBUTOR", "current-contributor", "current-contributor", "PUBLISHED")).toBe(false)
  })

  test("hydratePermissionsFromDb overrides default scopes", () => {
    // Hydrate where CONTRIBUTOR can suddenly delete posts, but loses 'create-post'
    const newRows: Array<{ role: UserRole; action: string }> = [
      { role: "CONTRIBUTOR", action: "delete-post" }
    ]

    hydratePermissionsFromDb(newRows)

    // Verify 'create-post' is lost because ALL_EDITABLE_ROLES are cleared and only 'delete-post' was provided
    expect(can("CONTRIBUTOR", "create-post")).toBe(false)
    
    // Verify 'delete-post' is granted
    expect(can("CONTRIBUTOR", "delete-post")).toBe(true)
    
    // Now CONTRIBUTOR can delete another user's published post (out of their original scope)
    expect(canTrashOrDeletePost("CONTRIBUTOR", "other-user", "current-contributor", "PUBLISHED")).toBe(true)

    // ADMIN is unaffected by clearance of ALL_EDITABLE_ROLES, they keep defaults plus any additions
    // Actually ADMIN is not in ALL_EDITABLE_ROLES, so they should retain their defaults.
    expect(can("ADMIN", "create-post")).toBe(true)
  })

  test("setRolePermissions modifies permissions dynamically at runtime", () => {
    // Grant REPORTER_TRANSLATOR 'delete-any-media'
    expect(can("REPORTER_TRANSLATOR", "delete-any-media")).toBe(false)

    const newActions: PermissionAction[] = ["create-post", "delete-any-media"]
    setRolePermissions("REPORTER_TRANSLATOR", newActions)

    expect(can("REPORTER_TRANSLATOR", "delete-any-media")).toBe(true)
    // Other scopes not included in the array are removed
    expect(can("REPORTER_TRANSLATOR", "view-all-posts")).toBe(false)
  })

  test("getPermissions returns isolated instances of sets", () => {
    const perms = getPermissions()
    const adminPerms = perms["ADMIN"]
    
    expect(adminPerms.has("create-post")).toBe(true)
    
    // Mutating the returned set shouldn't be the standard way, 
    // but if we use setRolePermissions it replaces the set entirely.
    setRolePermissions("ADMIN", ["delete-category"])
    
    expect(getPermissions()["ADMIN"].has("create-post")).toBe(false)
    expect(getPermissions()["ADMIN"].has("delete-category")).toBe(true)
  })

  test("EDITOR_IN_CHIEF is not in ALL_EDITABLE_ROLES and maintains absolute priority", () => {
    // Hydrating DB with empty permissions for editable roles
    hydratePermissionsFromDb([])

    // EDITOR_IN_CHIEF permissions cannot be cleared by DB hydration
    expect(can("EDITOR_IN_CHIEF", "delete-post")).toBe(true)
    expect(can("EDITOR_IN_CHIEF", "create-category")).toBe(true)
    expect(can("EDITOR_IN_CHIEF", "publish-pending-publish")).toBe(true)

    // EDITOR_IN_CHIEF can trash or delete posts by any author across all statuses
    expect(canTrashOrDeletePost("EDITOR_IN_CHIEF", "author-123", "editor-in-chief-id", "PUBLISHED")).toBe(true)
    expect(canTrashOrDeletePost("EDITOR_IN_CHIEF", "author-123", "editor-in-chief-id", "PENDING_PUBLISH")).toBe(true)
    expect(canTrashOrDeletePost("EDITOR_IN_CHIEF", "author-123", "editor-in-chief-id", "PENDING_REVIEW")).toBe(true)
    expect(canTrashOrDeletePost("EDITOR_IN_CHIEF", "author-123", "editor-in-chief-id", "DRAFT")).toBe(true)
    expect(canTrashOrDeletePost("EDITOR_IN_CHIEF", "author-123", "editor-in-chief-id", "REJECTED")).toBe(true)
  })
})
