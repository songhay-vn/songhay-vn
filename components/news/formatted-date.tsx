"use client"

const formatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
})

type FormattedDateProps = {
  value: Date | string | null | undefined
  className?: string
}

export function FormattedDate({ value, className }: FormattedDateProps) {
  if (!value) return null
  return (
    <span className={className} suppressHydrationWarning>
      {formatter.format(new Date(value))}
    </span>
  )
}
