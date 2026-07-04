"use client"

import { useMemo, useState, useEffect } from "react"

type GoodDayByAgeToolProps = {
  showUtilityLinks?: boolean
}

function toInputDate(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function toDisplayDate(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return ""
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed)
}

function diffYears(birthDate: Date, targetDate: Date) {
  let years = targetDate.getFullYear() - birthDate.getFullYear()
  const monthDiff = targetDate.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && targetDate.getDate() < birthDate.getDate())) {
    years -= 1
  }

  return years
}

export function GoodDayByAgeTool({ showUtilityLinks = false }: GoodDayByAgeToolProps = {}) {
  void showUtilityLinks

  const defaultBirthDate = "1998-01-01"
  const [birthDate, setBirthDate] = useState(defaultBirthDate)
  const [targetDate, setTargetDate] = useState("")
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setTargetDate(toInputDate(tomorrow))
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  const result = useMemo(() => {
    const birth = new Date(birthDate)
    const target = new Date(targetDate)

    if (Number.isNaN(birth.getTime()) || Number.isNaN(target.getTime()) || target < birth) {
      return null
    }

    const age = diffYears(birth, target)
    const weekday = target.getDay() === 0 ? 7 : target.getDay()

    const score = (age * 7 + target.getDate() * 3 + (target.getMonth() + 1) * 5 + weekday * 11) % 100

    if (score >= 70) {
      return {
        age,
        level: "Tốt",
        color: "text-emerald-700",
        bg: "bg-emerald-50 border-emerald-200",
        advice: "Ngày phù hợp để khởi động việc mới, hợp tác và chốt kế hoạch quan trọng.",
      }
    }

    if (score >= 40) {
      return {
        age,
        level: "Trung bình",
        color: "text-amber-700",
        bg: "bg-amber-50 border-amber-200",
        advice: "Ngày ổn định. Nên ưu tiên việc đang làm và tránh quyết định quá mạnh tay.",
      }
    }

    return {
      age,
      level: "Cân nhắc",
      color: "text-rose-700",
      bg: "bg-rose-50 border-rose-200",
      advice: "Nên hạn chế việc lớn, ưu tiên nghỉ ngơi, sắp xếp lại và kiểm tra thông tin kỹ hơn.",
    }
  }, [birthDate, targetDate])

  return (
    <div className="space-y-3">
      <label className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 px-3 py-2">
        <span className="text-sm font-medium text-zinc-600">Ngày sinh:</span>
        <input
          type="date"
          value={birthDate}
          onChange={(event) => setBirthDate(event.target.value)}
          className="rounded border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-700"
        />
      </label>

      <label className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 px-3 py-2">
        <span className="text-sm font-medium text-zinc-600">Ngày cần xem:</span>
        <input
          type="date"
          value={targetDate}
          onChange={(event) => setTargetDate(event.target.value)}
          className="rounded border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-700"
        />
      </label>

      <button
        type="button"
        onClick={() => setSubmitted(true)}
        className="inline-flex h-10 items-center justify-center rounded-md bg-rose-600 px-8 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-rose-700"
      >
        Xem
      </button>

      <p className="text-xs text-zinc-500">
        Kỳ xem: {toDisplayDate(targetDate)} {toDisplayDate(birthDate) ? `· Sinh ngày ${toDisplayDate(birthDate)}` : ""}
      </p>

      {submitted ? (
        result ? (
          <div className={`rounded-md border px-3 py-2 text-sm ${result.bg}`}>
            <p className={`font-semibold ${result.color}`}>Đánh giá: {result.level}</p>
            <p className="text-zinc-700">Tuổi âm lịch quy đổi tham khảo: {result.age}</p>
            <p className="mt-1 text-zinc-700">{result.advice}</p>
            <p className="mt-1 text-xs text-zinc-500">Công cụ chỉ mang tính tham khảo vui.</p>
          </div>
        ) : (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Vui lòng chọn ngày hợp lệ (ngày cần xem phải sau ngày sinh).
          </p>
        )
      ) : null}
    </div>
  )
}
