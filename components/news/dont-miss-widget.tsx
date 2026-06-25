import { Activity, ArrowRight, HeartPulse, Sparkles } from "lucide-react"
import Link from "next/link"

export function DontMissWidget() {
  return (
    <section className="border-t border-zinc-200 bg-white">
      <Link
        href="/tuoi-sinh-hoc"
        className="grid gap-4 p-4 transition hover:bg-zinc-50 md:grid-cols-[1fr_auto] md:items-center md:p-5"
      >
        <div className="flex gap-4">
          <span className="mt-1 inline-flex size-12 flex-shrink-0 items-center justify-center rounded-md bg-rose-600 text-white shadow-sm shadow-rose-900/20">
            <HeartPulse className="size-6" aria-hidden="true" />
          </span>
          <div className="space-y-2">
            <p className="text-lg leading-tight font-black text-zinc-950">
              Xét nghiệm tuổi sinh học
            </p>
            <p className="max-w-2xl text-sm leading-6 text-zinc-600">
              Trả lời nhanh các câu trắc nghiệm về giấc ngủ, vận động, dinh
              dưỡng và stress để nhận nhịp lão hóa tham khảo.
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-zinc-700">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-emerald-700">
                <Activity className="size-3.5" aria-hidden="true" />
                10 câu hỏi
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2.5 py-1 text-sky-700">
                <Sparkles className="size-3.5" aria-hidden="true" />
                Kết quả tức thì
              </span>
            </div>
          </div>
        </div>
        <span className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-rose-600 px-4 text-sm font-bold text-white hover:bg-rose-700 transition-colors md:justify-self-end">
          Làm trắc nghiệm
          <ArrowRight className="size-4" aria-hidden="true" />
        </span>
      </Link>
    </section>
  )
}
