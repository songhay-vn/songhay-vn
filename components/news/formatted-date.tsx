"use client"

import { formatDateTimeVi } from "@/lib/date-utils"

type FormattedDateProps = {
  value: Date | string | null | undefined
  className?: string
}

export function FormattedDate({ value, className }: FormattedDateProps) {
  if (!value) return null
  return (
    <span className={className} suppressHydrationWarning>
      {formatDateTimeVi(value)}
    </span>
  )
}
