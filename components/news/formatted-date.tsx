"use client"

type FormattedDateProps = {
  value: Date | string | null | undefined
  locale?: string
  className?: string
}

export function FormattedDate({
  value,
  locale = "vi-VN",
  className,
}: FormattedDateProps) {
  if (!value) return null
  return (
    <span className={className}>
      {new Date(value).toLocaleString(locale)}
    </span>
  )
}
