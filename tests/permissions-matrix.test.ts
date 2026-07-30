import { describe, expect, test } from "bun:test"

import {
  can,
  canApprovePendingReview,
  canCreateSubordinateAccount,
  canDeleteAnyMedia,
  canEditByStatus,
  canEditPenNames,
  canPublishNow,
  canSubmitPendingPublish,
  canViewAllPosts,
  getAllowedSubmitActions,
  roleCanCreate,
  ALL_EDITABLE_ROLES,
} from "../lib/permissions"

import type { UserRole } from "@prisma/client"

const ALL_ROLES: UserRole[] = [
  "EDITOR_IN_CHIEF",
  "MANAGING_EDITOR",
  "TEAM_LEAD",
  "REPORTER_TRANSLATOR",
  "CONTRIBUTOR",
]

describe("permissions matrix by role", () => {
  test("ALL_EDITABLE_ROLES excludes EDITOR_IN_CHIEF", () => {
    expect(ALL_EDITABLE_ROLES.includes("EDITOR_IN_CHIEF")).toBe(false)
    expect(ALL_EDITABLE_ROLES).toEqual([
      "MANAGING_EDITOR",
      "TEAM_LEAD",
      "REPORTER_TRANSLATOR",
      "CONTRIBUTOR",
    ])
  })

  test("critical workflow capabilities are mapped correctly", () => {
    expect(canApprovePendingReview("EDITOR_IN_CHIEF")).toBe(true)
    expect(canApprovePendingReview("MANAGING_EDITOR")).toBe(true)
    expect(canApprovePendingReview("TEAM_LEAD")).toBe(false)
    expect(canApprovePendingReview("REPORTER_TRANSLATOR")).toBe(false)
    expect(canApprovePendingReview("CONTRIBUTOR")).toBe(false)

    expect(canPublishNow("EDITOR_IN_CHIEF")).toBe(true)
    expect(canPublishNow("MANAGING_EDITOR")).toBe(true)
    expect(canPublishNow("TEAM_LEAD")).toBe(false)
    expect(canPublishNow("REPORTER_TRANSLATOR")).toBe(false)
    expect(canPublishNow("CONTRIBUTOR")).toBe(false)

    expect(canSubmitPendingPublish("EDITOR_IN_CHIEF")).toBe(true)
    expect(canSubmitPendingPublish("MANAGING_EDITOR")).toBe(true)
    expect(canSubmitPendingPublish("TEAM_LEAD")).toBe(true)
    expect(canSubmitPendingPublish("REPORTER_TRANSLATOR")).toBe(false)
    expect(canSubmitPendingPublish("CONTRIBUTOR")).toBe(false)
  })

  test("ownership and moderation capabilities are mapped correctly", () => {
    expect(canViewAllPosts("EDITOR_IN_CHIEF")).toBe(true)
    expect(canViewAllPosts("MANAGING_EDITOR")).toBe(true)
    expect(canViewAllPosts("TEAM_LEAD")).toBe(true)
    expect(canViewAllPosts("REPORTER_TRANSLATOR")).toBe(true)
    expect(canViewAllPosts("CONTRIBUTOR")).toBe(false)

    expect(canViewAllPosts("EDITOR_IN_CHIEF")).toBe(true)
    expect(canViewAllPosts("MANAGING_EDITOR")).toBe(true)
    expect(canViewAllPosts("TEAM_LEAD")).toBe(true)
    expect(canViewAllPosts("REPORTER_TRANSLATOR")).toBe(true)
    expect(canViewAllPosts("CONTRIBUTOR")).toBe(false)

    expect(canDeleteAnyMedia("EDITOR_IN_CHIEF")).toBe(true)
    expect(canDeleteAnyMedia("MANAGING_EDITOR")).toBe(true)
    expect(canDeleteAnyMedia("TEAM_LEAD")).toBe(false)
    expect(canDeleteAnyMedia("REPORTER_TRANSLATOR")).toBe(false)
    expect(canDeleteAnyMedia("CONTRIBUTOR")).toBe(false)

    expect(canCreateSubordinateAccount("EDITOR_IN_CHIEF")).toBe(true)
    expect(canCreateSubordinateAccount("MANAGING_EDITOR")).toBe(false)
    expect(canCreateSubordinateAccount("TEAM_LEAD")).toBe(false)
    expect(canCreateSubordinateAccount("REPORTER_TRANSLATOR")).toBe(false)
    expect(canCreateSubordinateAccount("CONTRIBUTOR")).toBe(false)
  })

  test("pin post capability defaults to managers only", () => {
    expect(can("ADMIN", "pin-post")).toBe(true)
    expect(can("EDITOR_IN_CHIEF", "pin-post")).toBe(true)
    expect(can("MANAGING_EDITOR", "pin-post")).toBe(true)
    expect(can("TEAM_LEAD", "pin-post")).toBe(false)
    expect(can("REPORTER_TRANSLATOR", "pin-post")).toBe(false)
    expect(can("CONTRIBUTOR", "pin-post")).toBe(false)
  })

  test("pen name management defaults to practical admin roles only", () => {
    expect(canEditPenNames("ADMIN")).toBe(true)
    expect(canEditPenNames("EDITOR_IN_CHIEF")).toBe(true)
    expect(canEditPenNames("USER")).toBe(false)
    expect(canEditPenNames("MANAGING_EDITOR")).toBe(false)
    expect(canEditPenNames("TEAM_LEAD")).toBe(false)
    expect(canEditPenNames("REPORTER_TRANSLATOR")).toBe(false)
    expect(canEditPenNames("CONTRIBUTOR")).toBe(false)
  })

  test("edit-by-status edge cases are enforced", () => {
    for (const role of ALL_ROLES) {
      const canEditReviewQueue = can(role, "edit-pending-review")
      expect(canEditByStatus(role, "DRAFT")).toBe(canEditReviewQueue)
      expect(canEditByStatus(role, "PENDING_REVIEW")).toBe(canEditReviewQueue)
      expect(canEditByStatus(role, "REJECTED")).toBe(canEditReviewQueue)
    }

    expect(canEditByStatus("EDITOR_IN_CHIEF", "PENDING_PUBLISH")).toBe(true)
    expect(canEditByStatus("MANAGING_EDITOR", "PENDING_PUBLISH")).toBe(true)
    expect(canEditByStatus("TEAM_LEAD", "PENDING_PUBLISH")).toBe(false)
    expect(canEditByStatus("REPORTER_TRANSLATOR", "PENDING_PUBLISH")).toBe(false)
    expect(canEditByStatus("CONTRIBUTOR", "PENDING_PUBLISH")).toBe(false)

    expect(canEditByStatus("EDITOR_IN_CHIEF", "PUBLISHED")).toBe(true)
    expect(canEditByStatus("MANAGING_EDITOR", "PUBLISHED")).toBe(true)
    expect(canEditByStatus("TEAM_LEAD", "PUBLISHED")).toBe(false)
    expect(canEditByStatus("REPORTER_TRANSLATOR", "PUBLISHED")).toBe(false)
    expect(canEditByStatus("CONTRIBUTOR", "PUBLISHED")).toBe(false)
  })

  test("allowed submit actions are role-specific", () => {
    expect(getAllowedSubmitActions("EDITOR_IN_CHIEF")).toEqual([
      "save-draft",
      "submit-review",
      "submit-publish",
      "publish",
    ])

    expect(getAllowedSubmitActions("MANAGING_EDITOR")).toEqual([
      "save-draft",
      "submit-review",
      "submit-publish",
      "publish",
    ])

    expect(getAllowedSubmitActions("TEAM_LEAD")).toEqual([
      "save-draft",
      "submit-review",
      "submit-publish",
    ])

    expect(getAllowedSubmitActions("REPORTER_TRANSLATOR")).toEqual([
      "save-draft",
      "submit-review",
    ])

    expect(getAllowedSubmitActions("CONTRIBUTOR")).toEqual([
      "save-draft",
      "submit-review",
    ])
  })

  test("subordinate creation guard edge cases", () => {
    expect(roleCanCreate("EDITOR_IN_CHIEF", "MANAGING_EDITOR")).toBe(true)
    expect(roleCanCreate("EDITOR_IN_CHIEF", "TEAM_LEAD")).toBe(true)
    expect(roleCanCreate("EDITOR_IN_CHIEF", "REPORTER_TRANSLATOR")).toBe(true)
    expect(roleCanCreate("EDITOR_IN_CHIEF", "CONTRIBUTOR")).toBe(true)

    expect(roleCanCreate("EDITOR_IN_CHIEF", "EDITOR_IN_CHIEF")).toBe(false)
    expect(roleCanCreate("MANAGING_EDITOR", "CONTRIBUTOR")).toBe(false)
    expect(roleCanCreate("TEAM_LEAD", "CONTRIBUTOR")).toBe(false)
    expect(roleCanCreate("REPORTER_TRANSLATOR", "CONTRIBUTOR")).toBe(false)
    expect(roleCanCreate("CONTRIBUTOR", "CONTRIBUTOR")).toBe(false)
  })
})
