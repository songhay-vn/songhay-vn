import { Save, Trash2, UserPlus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PendingSubmitButton } from "@/components/admin/pending-submit-button"
import { ROLE_LABELS_VI, ALL_EDITABLE_ROLES } from "@/lib/permissions"
import { Select } from "@/components/ui/select"
import type { UserRow } from "@/app/admin/data-types"
import type { UserRole } from "@prisma/client"

const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  ADMIN: "bg-red-100 text-red-700 border-red-200",
  USER: "bg-zinc-100 text-zinc-600 border-zinc-200",
  EDITOR_IN_CHIEF: "bg-violet-100 text-violet-700 border-violet-200",
  MANAGING_EDITOR: "bg-blue-100 text-blue-700 border-blue-200",
  TEAM_LEAD: "bg-sky-100 text-sky-700 border-sky-200",
  REPORTER_TRANSLATOR: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CONTRIBUTOR: "bg-amber-100 text-amber-700 border-amber-200",
}



type SettingsUsersTabProps = {
  users: UserRow[]
  currentUserId: string
  updateUserRole: (formData: FormData) => Promise<void>
  deleteUser: (formData: FormData) => Promise<void>
  createSubordinateAccount: (formData: FormData) => Promise<void>
  canCreateSubordinateAccount: boolean
}

export function SettingsUsersTab({
  users,
  currentUserId,
  updateUserRole,
  deleteUser,
  createSubordinateAccount,
  canCreateSubordinateAccount,
}: SettingsUsersTabProps) {
  return (
    <div className="space-y-8">
      {canCreateSubordinateAccount && (
        <section className="space-y-4 rounded-md border border-zinc-200 bg-white p-4">
          <div>
            <h3 className="text-base font-bold text-zinc-950">Tạo tài khoản mới</h3>
            <p className="text-xs text-zinc-600">
              Cấp quyền truy cập cho thành viên mới của ban biên tập.
            </p>
          </div>
          <form
            action={createSubordinateAccount}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="subordinateName">Họ tên</Label>
              <Input id="subordinateName" name="name" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subordinateEmail">Email</Label>
              <Input id="subordinateEmail" name="email" type="email" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subordinateRole">Vai trò</Label>
              <Select
                id="subordinateRole"
                name="role"
                defaultValue="CONTRIBUTOR"
                className="h-10"
              >
                <option value="MANAGING_EDITOR">Thư ký biên tập</option>
                <option value="TEAM_LEAD">Trưởng nhóm</option>
                <option value="REPORTER_TRANSLATOR">
                  Phóng viên/Biên dịch
                </option>
                <option value="CONTRIBUTOR">Cộng tác viên</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subordinatePassword">Mật khẩu khởi tạo</Label>
              <Input
                id="subordinatePassword"
                name="password"
                type="password"
                minLength={8}
                required
              />
            </div>
            <div className="lg:col-span-4">
              <PendingSubmitButton
                type="submit"
                pendingText="Đang tạo tài khoản..."
              >
                <UserPlus className="size-4" />
                Tạo tài khoản
              </PendingSubmitButton>
            </div>
          </form>
        </section>
      )}

      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold">Danh sách người dùng</p>
        </div>
        <div className="overflow-x-auto rounded-md border border-zinc-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  Họ tên
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  Vai trò hiện tại
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  Ngày tạo
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => {
                const isSelf = user.id === currentUserId
                const isProtected =
                  user.role === "EDITOR_IN_CHIEF" || user.role === "ADMIN"
                const canDelete = !isSelf && !isProtected

                return (
                  <tr
                    key={user.id}
                    className="group transition-colors hover:bg-muted/20"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.name}</span>
                        {isSelf && (
                          <Badge
                            variant="secondary"
                            className="h-4 px-1.5 text-[10px]"
                          >
                            Bạn
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-xs ${ROLE_BADGE_COLORS[user.role]}`}
                      >
                        {ROLE_LABELS_VI[user.role]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* Role change form */}
                        {!isSelf && !isProtected ? (
                          <form
                            action={updateUserRole}
                            className="flex items-center gap-1.5"
                          >
                            <input type="hidden" name="userId" value={user.id} />
                            <Select
                              name="newRole"
                              defaultValue={user.role}
                              className="h-7 px-2 py-0 text-xs w-auto"
                            >
                              {ALL_EDITABLE_ROLES.map((role) => (
                                <option key={role} value={role}>
                                  {ROLE_LABELS_VI[role]}
                                </option>
                              ))}
                            </Select>
                            <PendingSubmitButton
                              type="submit"
                              pendingText="..."
                              className="h-7 px-2.5 text-xs"
                            >
                              <Save className="size-3.5" />
                              Lưu
                            </PendingSubmitButton>
                          </form>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            {isSelf ? "Tài khoản của bạn" : "Không thể thay đổi"}
                          </span>
                        )}

                        {/* Delete form */}
                        {canDelete && (
                          <form action={deleteUser}>
                            <input type="hidden" name="userId" value={user.id} />
                            <PendingSubmitButton
                              type="submit"
                              pendingText="..."
                              className="h-7 border-red-200 bg-red-50 px-2.5 text-xs text-red-600 hover:bg-red-100 hover:text-red-700"
                              variant="outline"
                            >
                              <Trash2 className="size-3.5" />
                              Xóa
                            </PendingSubmitButton>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Chưa có người dùng nào.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
