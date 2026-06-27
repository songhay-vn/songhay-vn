export function isPrismaSchemaMismatchError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false
  }

  const code = (error as { code?: string }).code
  if (code === "P2021" || code === "P2022") {
    return true
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof (error as { message?: unknown }).message === "string"
        ? String((error as { message?: unknown }).message)
        : ""

  return (
    message.includes("does not exist in the current database") ||
    message.includes("table `public.BioAgeSubmission` does not exist") ||
    message.includes('relation "BioAgeSubmission" does not exist')
  )
}
