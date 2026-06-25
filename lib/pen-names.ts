export function normalizePenName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("vi-VN")
}

export function toPenNameDisplayName(value: string) {
  return value.trim().replace(/\s+/g, " ")
}

export function getPenNameInitials(value: string) {
  const parts = toPenNameDisplayName(value)
    .split(" ")
    .filter(Boolean)

  if (parts.length === 0) {
    return "BD"
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("vi-VN")
}
