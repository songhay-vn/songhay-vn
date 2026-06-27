"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { Activity, ArrowRight, HeartPulse, Sparkles } from "lucide-react"

import { BIO_AGE_MAX_AGE, BIO_AGE_MIN_AGE } from "@/lib/bio-age"

function parseBannerAge(value: string) {
  const parsed = Number.parseInt(value, 10)

  if (
    !Number.isFinite(parsed) ||
    String(parsed) !== value.trim() ||
    parsed < BIO_AGE_MIN_AGE ||
    parsed > BIO_AGE_MAX_AGE
  ) {
    return null
  }

  return parsed
}

export function DontMissWidget() {
  const router = useRouter()
  const [age, setAge] = useState("")

  function updateAge(value: string) {
    setAge(value.replace(/[^\d]/g, "").slice(0, 3))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validAge = parseBannerAge(age)
    router.push(
      validAge ? `/tinh-tuoi-sinh-hoc-${validAge}` : "/tinh-tuoi-sinh-hoc"
    )
  }

  return (
    <section className="border-t border-zinc-200 bg-white">
      <form
        onSubmit={handleSubmit}
        className="grid gap-4 p-4 transition hover:bg-zinc-50 md:grid-cols-[minmax(0,1fr)_minmax(260px,auto)] md:items-center md:p-5"
      >
        <div className="flex gap-4">
          <span className="mt-1 inline-flex size-12 flex-shrink-0 items-center justify-center rounded-md bg-rose-600 text-white shadow-sm shadow-rose-900/20">
            <HeartPulse className="size-6" aria-hidden="true" />
          </span>
          <div className="space-y-2">
            <p className="text-lg leading-tight font-black text-zinc-950">
              Cách tính tuổi sinh học
            </p>
            <p className="max-w-2xl text-sm leading-6 text-zinc-600">
              Nhập tuổi rồi trả lời nhanh các câu trắc nghiệm về giới tính, giấc
              ngủ, vận động, dinh dưỡng và stress để nhận tuổi sinh học tham
              khảo.
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-zinc-700">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-emerald-700">
                <Activity className="size-3.5" aria-hidden="true" />
                14 câu hỏi
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2.5 py-1 text-sky-700">
                <Sparkles className="size-3.5" aria-hidden="true" />
                Kết quả tức thì
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-[9rem_auto] md:justify-self-end">
          <label className="block text-xs font-bold text-zinc-700">
            Tuổi của bạn
            <input
              value={age}
              onChange={(event) => updateAge(event.target.value)}
              type="number"
              inputMode="numeric"
              min={BIO_AGE_MIN_AGE}
              max={BIO_AGE_MAX_AGE}
              className="mt-1 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base font-black text-zinc-950 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
              placeholder="50"
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center gap-2 self-end rounded-md bg-rose-600 px-4 text-sm font-bold text-white transition-colors hover:bg-rose-700"
          >
            Làm trắc nghiệm
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </form>
    </section>
  )
}
