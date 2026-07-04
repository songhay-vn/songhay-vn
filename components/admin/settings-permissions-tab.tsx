import { Save } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PendingSubmitButton } from "@/components/admin/pending-submit-button"
import {
  ALL_PERMISSION_ACTIONS,
  ALL_EDITABLE_ROLES,
  ACTION_LABELS_VI,
  ROLE_LABELS_VI,
  type PermissionAction,
} from "@/lib/permissions"
import type { PermissionsMatrixRow } from "@/app/admin/data-loaders/permissions"
import type { UserRole } from "@prisma/client"

type SettingsPermissionsTabProps = {
  permissionsMatrix: PermissionsMatrixRow[]
  updateRolePermissions: (formData: FormData) => Promise<void>
}

// Group actions into logical categories for display
const ACTION_GROUPS: { label: string; actions: PermissionAction[] }[] = [
  {
    label: "Bài viết",
    actions: [
      "create-post",
      "submit-pending-review",
      "edit-pending-review",
      "submit-pending-publish",
      "approve-pending-review",
      "publish-pending-publish",
      "edit-pending-publish",
      "edit-published",
      "view-all-posts",
      "pin-post",
    ],
  },
  {
    label: "Chuyên mục & Media",
    actions: [
      "create-category",
      "edit-category",
      "delete-category",
      "delete-any-media",
    ],
  },
  {
    label: "Quản trị",
    actions: ["moderate-comment", "edit-pen-name", "create-subordinate-account"],
  },
]

function RolePermissionsCard({
  row,
  updateRolePermissions,
}: {
  row: PermissionsMatrixRow
  updateRolePermissions: (formData: FormData) => Promise<void>
}) {
  return (
    <Card>
      <CardHeader className="px-4 pt-6 pb-3">
        <div className="flex items-center gap-3">
          <CardTitle className="text-base">
            {ROLE_LABELS_VI[row.role]}
          </CardTitle>
          <Badge variant="outline" className="font-mono text-xs">
            {row.role}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form action={updateRolePermissions}>
          <input type="hidden" name="role" value={row.role} />
          <div className="space-y-4">
            {ACTION_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="mb-2 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                  {group.label}
                </p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {group.actions.map((action) => {
                    const checked = row.actions.has(action)
                    return (
                      <label
                        key={action}
                        className="flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted/50"
                      >
                        <input
                          type="checkbox"
                          name={`perm_${action}`}
                          defaultChecked={checked}
                          value="on"
                          className="h-4 w-4 rounded accent-violet-600"
                        />
                        <span
                          className={
                            checked ? "font-medium" : "text-muted-foreground"
                          }
                        >
                          {ACTION_LABELS_VI[action]}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <PendingSubmitButton type="submit" pendingText="Đang lưu...">
              <Save className="size-4" />
              Lưu phân quyền
            </PendingSubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export function SettingsPermissionsTab({
  permissionsMatrix,
  updateRolePermissions,
}: SettingsPermissionsTabProps) {
  const matrixByRole = new Map<UserRole, PermissionsMatrixRow>(
    permissionsMatrix.map((r) => [r.role, r])
  )

  return (
    <div className="space-y-4">
      {ALL_EDITABLE_ROLES.map((role) => {
        const row = matrixByRole.get(role) ?? {
          role,
          actions: new Set<PermissionAction>(),
        }
        return (
          <RolePermissionsCard
            key={role}
            row={row}
            updateRolePermissions={updateRolePermissions}
          />
        )
      })}
    </div>
  )
}
