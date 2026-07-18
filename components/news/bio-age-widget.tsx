"use client"

import { useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { CheckCircle2, RotateCcw } from "lucide-react"

import {
  BIO_AGE_MAX_AGE,
  BIO_AGE_MIN_AGE,
  calculateEstimatedBioAge,
  getBioAgeResult,
  type BioAgeGenderValue,
} from "@/lib/bio-age"
import { Button } from "@/components/ui/button"

type QuizOption = {
  label: string
  value: number
}

type QuizQuestion = {
  id: string
  title: string
  options: QuizOption[]
}

type GenderInput = BioAgeGenderValue | ""

const BIO_AGE_SESSION_STORAGE_KEY = "bioAgeSessionId"
const DEMOGRAPHIC_QUESTION_COUNT = 2

const QUESTIONS: QuizQuestion[] = [
  {
    id: "sleep",
    title: "Trong 7 ngày gần đây, giấc ngủ của bạn thường như thế nào?",
    options: [
      { label: "Ngủ 7-8 giờ, ít tỉnh giấc", value: 0 },
      { label: "Ngủ đủ nhưng chưa đều giờ", value: 1 },
      { label: "Thường dưới 6 giờ hoặc ngủ chập chờn", value: 2 },
      { label: "Mất ngủ nhiều đêm, dậy rất mệt", value: 3 },
    ],
  },
  {
    id: "movement",
    title: "Một tuần bạn vận động mức vừa hoặc mạnh khoảng bao lâu?",
    options: [
      { label: "Từ 150 phút trở lên", value: 0 },
      { label: "Khoảng 90-149 phút", value: 1 },
      { label: "Dưới 90 phút", value: 2 },
      { label: "Hầu như không vận động", value: 3 },
    ],
  },
  {
    id: "food",
    title: "Bữa ăn hằng ngày của bạn có rau, đạm tốt và thực phẩm ít chế biến?",
    options: [
      { label: "Gần như mỗi bữa", value: 0 },
      { label: "Phần lớn các ngày", value: 1 },
      { label: "Có nhưng thất thường", value: 2 },
      { label: "Ít rau, nhiều đồ ngọt hoặc đồ chế biến sẵn", value: 3 },
    ],
  },
  {
    id: "stress",
    title: "Bạn phục hồi sau stress như thế nào?",
    options: [
      { label: "Bình tĩnh lại khá nhanh", value: 0 },
      { label: "Cần nghỉ một lúc mới ổn", value: 1 },
      { label: "Thường căng nhiều giờ", value: 2 },
      { label: "Căng kéo dài, ảnh hưởng ngủ hoặc ăn uống", value: 3 },
    ],
  },
  {
    id: "energy",
    title: "Năng lượng buổi sáng của bạn thường ở mức nào?",
    options: [
      { label: "Tỉnh táo, bắt nhịp nhanh", value: 0 },
      { label: "Cần một chút thời gian để vào guồng", value: 1 },
      { label: "Hay uể oải đến gần trưa", value: 2 },
      { label: "Mệt mỏi gần như cả ngày", value: 3 },
    ],
  },
  {
    id: "screen",
    title: "Bạn dùng màn hình sát giờ ngủ thường xuyên không?",
    options: [
      { label: "Hiếm khi, có thời gian tắt máy trước ngủ", value: 0 },
      { label: "Một vài tối mỗi tuần", value: 1 },
      { label: "Hầu như tối nào cũng dùng", value: 2 },
      { label: "Dùng đến lúc buồn ngủ hoặc ngủ quên", value: 3 },
    ],
  },
  {
    id: "sitting",
    title: "Trong ngày, bạn có ngồi lâu hoặc ít đổi tư thế không?",
    options: [
      { label: "Ít khi ngồi quá lâu, thường xuyên đứng dậy", value: 0 },
      { label: "Có ngồi lâu nhưng vẫn nghỉ xen kẽ", value: 1 },
      { label: "Thường ngồi liền nhiều giờ", value: 2 },
      { label: "Hầu như cả ngày ít vận động, ít đổi tư thế", value: 3 },
    ],
  },
  {
    id: "daylight",
    title:
      "Bạn có ra ngoài, tiếp xúc ánh sáng tự nhiên hoặc vận động nhẹ ban ngày?",
    options: [
      { label: "Có gần như mỗi ngày", value: 0 },
      { label: "Có vài ngày mỗi tuần", value: 1 },
      { label: "Rất ít, chủ yếu ở trong nhà", value: 2 },
      {
        label: "Gần như không có ánh sáng tự nhiên hoặc vận động nhẹ",
        value: 3,
      },
    ],
  },
  {
    id: "social",
    title: "Bạn có kết nối xã hội hoặc hoạt động khiến mình thấy có ý nghĩa?",
    options: [
      { label: "Có đều đặn", value: 0 },
      { label: "Có nhưng chưa thường xuyên", value: 1 },
      { label: "Ít, chủ yếu tự xoay xở", value: 2 },
      { label: "Rất ít, thường thấy cô lập", value: 3 },
    ],
  },
  {
    id: "habits",
    title: "Thuốc lá, rượu bia hoặc đồ uống nhiều đường xuất hiện thế nào?",
    options: [
      { label: "Hiếm hoặc không dùng", value: 0 },
      { label: "Có dùng nhưng kiểm soát", value: 1 },
      { label: "Dùng vài lần mỗi tuần", value: 2 },
      { label: "Dùng thường xuyên, khó giảm", value: 3 },
    ],
  },
  {
    id: "recovery",
    title: "Sau một ngày bận rộn, cơ thể bạn hồi phục ra sao?",
    options: [
      { label: "Nghỉ một đêm là hồi lại", value: 0 },
      { label: "Cần thêm nửa ngày để ổn", value: 1 },
      { label: "Mệt tích lũy vài ngày", value: 2 },
      { label: "Luôn thấy thiếu sức", value: 3 },
    ],
  },
  {
    id: "checkup",
    title: "Bạn theo dõi sức khỏe định kỳ như huyết áp, đường huyết, mỡ máu?",
    options: [
      { label: "Có lịch theo dõi rõ ràng", value: 0 },
      { label: "Thỉnh thoảng có kiểm tra", value: 1 },
      { label: "Chỉ kiểm tra khi thấy không ổn", value: 2 },
      { label: "Gần như không theo dõi", value: 3 },
    ],
  },
]

function parseValidAge(value: string) {
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

function getAgeFromPathname(pathname: string | null) {
  const match = pathname?.match(/^\/tinh-tuoi-sinh-hoc-(\d{1,3})$/)

  if (!match) {
    return ""
  }

  const age = parseValidAge(match[1])
  return age ? String(age) : ""
}

function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `bio-age-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function getBioAgeSessionId() {
  try {
    const existing = window.localStorage.getItem(BIO_AGE_SESSION_STORAGE_KEY)

    if (existing) {
      return existing
    }

    const nextSessionId = createSessionId()
    window.localStorage.setItem(BIO_AGE_SESSION_STORAGE_KEY, nextSessionId)
    return nextSessionId
  } catch {
    return createSessionId()
  }
}

export function BioAgeWidget() {
  const router = useRouter()
  const pathname = usePathname()
  const ageFromPathname = getAgeFromPathname(pathname)
  const [manualAge, setManualAge] = useState<string | null>(null)
  const [gender, setGender] = useState<GenderInput>("")
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)

  const age = manualAge ?? ageFromPathname
  const validAge = parseValidAge(age)
  const answeredLifestyleCount = Object.keys(answers).length
  const answeredProfileCount = (validAge ? 1 : 0) + (gender ? 1 : 0)
  const answeredCount = answeredLifestyleCount + answeredProfileCount
  const totalQuestionCount = QUESTIONS.length + DEMOGRAPHIC_QUESTION_COUNT
  const isComplete = answeredCount === totalQuestionCount
  const score = useMemo(
    () => Object.values(answers).reduce((total, value) => total + value, 0),
    [answers]
  )
  const result = getBioAgeResult(score)
  const estimatedBioAge = validAge
    ? calculateEstimatedBioAge(validAge, result)
    : null

  function selectAnswer(questionId: string, value: number) {
    setAnswers((current) => ({ ...current, [questionId]: value }))
    setSubmitted(false)
  }

  function selectGender(value: BioAgeGenderValue) {
    setGender(value)
    setSubmitted(false)
  }

  function updateAge(value: string) {
    const sanitizedValue = value.replace(/[^\d]/g, "").slice(0, 3)
    setManualAge(sanitizedValue)
    setSubmitted(false)

    const nextAge = parseValidAge(sanitizedValue)

    if (nextAge) {
      router.replace(`/tinh-tuoi-sinh-hoc-${nextAge}`, { scroll: false })
    }
  }

  function resetQuiz() {
    setManualAge("")
    setGender("")
    setAnswers({})
    setSubmitted(false)
    router.replace("/tinh-tuoi-sinh-hoc", { scroll: false })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function persistSubmission() {
    if (!validAge || !gender) {
      return
    }

    try {
      await fetch("/api/bio-age-submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: getBioAgeSessionId(),
          age: validAge,
          gender,
          score,
          sourcePath: window.location.pathname,
        }),
      })
    } catch {
      // The result should stay usable even if analytics storage is unavailable.
    }
  }

  function handleSubmit() {
    setSubmitted(true)

    if (isComplete) {
      void persistSubmission()
    }
  }

  return (
    <section className="space-y-6" aria-labelledby="bio-age-quiz-title">
      <div className="flex flex-col gap-3 border-y border-zinc-200 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="bio-age-quiz-title"
            className="text-2xl font-black text-zinc-950"
          >
            Bộ câu hỏi tuổi sinh học
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-900 font-medium">
            {answeredCount}/{totalQuestionCount} câu đã trả lời
          </p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 sm:w-56">
          <div
            className="h-full bg-rose-600 transition-all"
            style={{
              width: `${(answeredCount / totalQuestionCount) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="grid gap-4">
        <fieldset className="border border-zinc-200 bg-white p-4 md:p-5">
          <legend className="mb-4 flex gap-3 text-base leading-6 font-bold text-zinc-950">
            <span className="inline-flex size-7 flex-shrink-0 items-center justify-center rounded-md bg-zinc-950 text-xs font-black text-white">
              1
            </span>
            Bạn bao nhiêu tuổi?
          </legend>
          <label className="block max-w-xs text-sm font-semibold text-zinc-700">
            Tuổi
            <input
              value={age}
              onChange={(event) => updateAge(event.target.value)}
              type="number"
              inputMode="numeric"
              min={BIO_AGE_MIN_AGE}
              max={BIO_AGE_MAX_AGE}
              className="mt-2 h-11 w-full rounded-md border border-zinc-300 px-3 text-base font-bold text-zinc-950 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
              placeholder="Ví dụ: 50"
            />
          </label>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Nhập từ {BIO_AGE_MIN_AGE} đến {BIO_AGE_MAX_AGE} tuổi.
          </p>
        </fieldset>

        <fieldset className="border border-zinc-200 bg-white p-4 md:p-5">
          <legend className="mb-4 flex gap-3 text-base leading-6 font-bold text-zinc-950">
            <span className="inline-flex size-7 flex-shrink-0 items-center justify-center rounded-md bg-zinc-950 text-xs font-black text-white">
              2
            </span>
            Giới tính của bạn?
          </legend>

          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { label: "Nam", value: "MALE" as const },
              { label: "Nữ", value: "FEMALE" as const },
            ].map((option) => {
              const selected = gender === option.value

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => selectGender(option.value)}
                  className={`flex min-h-12 items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm font-semibold transition ${
                    selected
                      ? "border-rose-500 bg-rose-50 text-rose-800"
                      : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300 hover:bg-white"
                  }`}
                  aria-pressed={selected}
                >
                  <span>{option.label}</span>
                  {selected ? (
                    <CheckCircle2 className="size-4 flex-shrink-0" />
                  ) : null}
                </button>
              )
            })}
          </div>
        </fieldset>

        {QUESTIONS.map((question, index) => (
          <fieldset
            key={question.id}
            className="border border-zinc-200 bg-white p-4 md:p-5"
          >
            <legend className="mb-4 flex gap-3 text-base leading-6 font-bold text-zinc-950">
              <span className="inline-flex size-7 flex-shrink-0 items-center justify-center rounded-md bg-zinc-950 text-xs font-black text-white">
                {index + DEMOGRAPHIC_QUESTION_COUNT + 1}
              </span>
              {question.title}
            </legend>

            <div className="grid gap-2 sm:grid-cols-2">
              {question.options.map((option) => {
                const selected = answers[question.id] === option.value

                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => selectAnswer(question.id, option.value)}
                    className={`flex min-h-12 items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm font-semibold transition ${
                      selected
                        ? "border-rose-500 bg-rose-50 text-rose-800"
                        : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300 hover:bg-white"
                    }`}
                    aria-pressed={selected}
                  >
                    <span>{option.label}</span>
                    {selected ? (
                      <CheckCircle2 className="size-4 flex-shrink-0" />
                    ) : null}
                  </button>
                )
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="flex flex-col gap-3 border-t border-zinc-200 pt-4 sm:flex-row">
        <Button
          type="button"
          className="h-11 rounded-md bg-rose-600 px-5 text-white hover:bg-rose-700"
          onClick={handleSubmit}
        >
          Xem kết quả
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-md"
          onClick={resetQuiz}
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Làm lại
        </Button>
      </div>

      {submitted ? (
        <div
          className={`border p-5 ${isComplete ? result.surface : "border-zinc-200 bg-zinc-50"}`}
        >
          {isComplete && estimatedBioAge ? (
            <div className="space-y-3">
              <p className={`text-sm font-black uppercase ${result.accent}`}>
                {result.label}
              </p>
              <p className="text-3xl font-black text-zinc-950">
                Tuổi sinh học của bạn khoảng {estimatedBioAge.label}
              </p>
              <p className="text-sm leading-6 text-zinc-700">{result.copy}</p>
              <p className="text-xs leading-5 text-zinc-500">
                Kết quả chỉ dùng để tự quan sát lối sống, không thay thế xét
                nghiệm y khoa hoặc tư vấn từ bác sĩ.
              </p>
            </div>
          ) : (
            <p className="text-sm font-semibold text-zinc-700">
              Bạn cần trả lời đủ {totalQuestionCount} câu và nhập tuổi hợp lệ để
              xem kết quả.
            </p>
          )}
        </div>
      ) : null}
    </section>
  )
}
