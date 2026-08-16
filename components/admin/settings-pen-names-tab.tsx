import Image from "next/image"
import { ImageOff, Plus, Save, Trash2 } from "lucide-react"

import type { PenNameSettingsRow } from "@/app/admin/data-loaders/pen-names"
import { ConfirmActionForm } from "@/components/admin/confirm-action-form"
import { PendingSubmitButton } from "@/components/admin/pending-submit-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getPenNameInitials } from "@/lib/pen-names"

type PenNameAction = (formData: FormData) => Promise<void>

type SettingsPenNamesTabProps = {
  rows: PenNameSettingsRow[]
  createPenName: PenNameAction
  updatePenName: PenNameAction
  removePenNameAvatar: PenNameAction
  deletePenName: PenNameAction
}

function PenNameAvatarPreview({
  name,
  avatarUrl,
}: {
  name: string
  avatarUrl: string | null
}) {
  return (
    <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted text-sm font-semibold text-muted-foreground">
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={`Ảnh đại diện bút danh ${name}`}
          width={56}
          height={56}
          sizes="56px"
          className="size-full object-cover"
        />
      ) : (
        getPenNameInitials(name)
      )}
    </div>
  )
}

function PenNameRow({
  row,
  updatePenName,
  removePenNameAvatar,
  deletePenName,
}: {
  row: PenNameSettingsRow
  updatePenName: PenNameAction
  removePenNameAvatar: PenNameAction
  deletePenName: PenNameAction
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <form
            action={updatePenName}
            className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-center"
          >
            <input type="hidden" name="penNameId" value={row.id} />
            <PenNameAvatarPreview name={row.name} avatarUrl={row.avatarUrl} />
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.7fr)_auto] md:items-end">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`penName-${row.id}`}>Tên bút danh</Label>
                <Input
                  id={`penName-${row.id}`}
                  name="name"
                  defaultValue={row.name}
                  required
                  maxLength={120}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`penNameAvatar-${row.id}`}>Ảnh đại diện</Label>
                <Input
                  id={`penNameAvatar-${row.id}`}
                  name="avatarUpload"
                  type="file"
                  accept="image/*"
                />
              </div>
              <PendingSubmitButton
                type="submit"
                pendingText="Đang lưu..."
                className="h-9"
              >
                <Save className="size-4" />
                Lưu
              </PendingSubmitButton>
            </div>
          </form>

          <div className="flex min-h-9 flex-wrap items-center gap-2 lg:justify-end">
            <Badge
              variant="secondary"
              className="flex h-9 items-center rounded-md px-3 font-semibold text-zinc-900"
            >
              {row._count.posts.toLocaleString("vi-VN")} bài
            </Badge>
            <ConfirmActionForm
              action={removePenNameAvatar}
              confirmMessage={`Gỡ ảnh đại diện của bút danh "${row.name}"?`}
              fields={[{ name: "penNameId", value: row.id }]}
              className="contents"
            >
              <Button
                type="submit"
                variant="outline"
                disabled={!row.avatarUrl}
                className="h-9"
              >
                <ImageOff className="size-4" />
                Gỡ ảnh
              </Button>
            </ConfirmActionForm>
            <ConfirmActionForm
              action={deletePenName}
              confirmMessage={`Xóa bút danh "${row.name}"? Các bài đang dùng bút danh này sẽ giữ tên đã lưu nhưng không còn avatar.`}
              fields={[{ name: "penNameId", value: row.id }]}
              className="contents"
            >
              <Button type="submit" variant="destructive" className="h-9">
                <Trash2 className="size-4" />
                Xóa
              </Button>
            </ConfirmActionForm>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function SettingsPenNamesTab({
  rows,
  createPenName,
  updatePenName,
  removePenNameAvatar,
  deletePenName,
}: SettingsPenNamesTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bút danh</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={createPenName}
            className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.7fr)_auto] md:items-end"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="newPenName">Tên bút danh</Label>
              <Input
                id="newPenName"
                name="name"
                placeholder="Tên tác giả hiển thị công khai"
                required
                maxLength={120}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="newPenNameAvatar">Ảnh đại diện</Label>
              <Input
                id="newPenNameAvatar"
                name="avatarUpload"
                type="file"
                accept="image/*"
              />
              <p className="text-xs text-muted-foreground">
                Tải lên trực tiếp để hiển thị bên dưới bài viết, không lưu vào kho media.
              </p>
            </div>
            <PendingSubmitButton type="submit" pendingText="Đang tạo...">
              <Plus className="size-4" />
              Tạo bút danh
            </PendingSubmitButton>
          </form>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Chưa có bút danh nào.
          </CardContent>
        </Card>
      ) : (
        rows.map((row) => (
          <PenNameRow
            key={row.id}
            row={row}
            updatePenName={updatePenName}
            removePenNameAvatar={removePenNameAvatar}
            deletePenName={deletePenName}
          />
        ))
      )}
    </div>
  )
}
