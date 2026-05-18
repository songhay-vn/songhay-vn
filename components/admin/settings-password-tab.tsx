import { Save, KeyRound } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PendingSubmitButton } from "@/components/admin/pending-submit-button"
import type { getUsersData } from "@/app/admin/data-loaders"

type SettingsPasswordTabProps = {
  users: Awaited<ReturnType<typeof getUsersData>>
  updateOwnPassword: (formData: FormData) => Promise<void>
  resetUserPassword: (formData: FormData) => Promise<void>
  canCreateSubordinateAccount: boolean
}

export function SettingsPasswordTab({
  users,
  updateOwnPassword,
  resetUserPassword,
  canCreateSubordinateAccount,
}: SettingsPasswordTabProps) {
  return (
    <div className="space-y-6">
      <section className="space-y-4 max-w-md">
        <div>
          <h3 className="text-lg font-medium">Đổi mật khẩu bản thân</h3>
          <p className="text-sm text-zinc-500">
            Cập nhật mật khẩu đăng nhập của bạn.
          </p>
        </div>
        <form action={updateOwnPassword} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">Mật khẩu mới</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              minLength={8}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              minLength={8}
              required
            />
          </div>
          <PendingSubmitButton type="submit" pendingText="Đang lưu...">
            <Save className="size-4" />
            Lưu thay đổi
          </PendingSubmitButton>
        </form>
      </section>

      {canCreateSubordinateAccount ? (
        <>
          <hr className="border-zinc-200" />
          <section className="space-y-4 max-w-md">
            <div>
              <h3 className="text-lg font-medium text-destructive">
                Reset mật khẩu người dùng
              </h3>
              <p className="text-sm text-zinc-500">
                Đặt lại mật khẩu cho các tài khoản cấp dưới.
              </p>
            </div>
            <form action={resetUserPassword} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="userId">Chọn người dùng</Label>
                <select
                  id="userId"
                  name="userId"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">-- Chọn người dùng --</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email}) - {user.role}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adminNewPassword">Mật khẩu mới</Label>
                <Input
                  id="adminNewPassword"
                  name="newPassword"
                  type="password"
                  minLength={8}
                  required
                />
              </div>
              <PendingSubmitButton
                type="submit"
                variant="destructive"
                pendingText="Đang reset..."
              >
                <KeyRound className="size-4" />
                Reset mật khẩu
              </PendingSubmitButton>
            </form>
          </section>
        </>
      ) : null}
    </div>
  )
}
