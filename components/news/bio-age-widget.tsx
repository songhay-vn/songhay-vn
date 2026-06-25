"use client"

import { useMemo, useState } from "react"
import { CheckCircle2, RotateCcw } from "lucide-react"

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

function getResult(score: number) {
  if (score <= 7) {
    return {
      label: "Nhịp sinh học trẻ hơn",
      accent: "text-emerald-700",
      surface: "bg-emerald-50 border-emerald-200",
      delta: "-2 đến -5",
      copy: "Các thói quen nền tảng đang hỗ trợ phục hồi tốt. Tiếp tục giữ nhịp ngủ, vận động và bữa ăn ổn định.",
    }
  }

  if (score <= 15) {
    return {
      label: "Đang cân bằng",
      accent: "text-sky-700",
      surface: "bg-sky-50 border-sky-200",
      delta: "-1 đến +2",
      copy: "Cơ thể có nền tảng khá ổn nhưng vẫn còn vài điểm kéo tuổi sinh học lên. Chọn một thói quen dễ nhất để cải thiện trước.",
    }
  }

  if (score <= 22) {
    return {
      label: "Cần phục hồi",
      accent: "text-amber-700",
      surface: "bg-amber-50 border-amber-200",
      delta: "+3 đến +6",
      copy: "Dấu hiệu thiếu ngủ, stress hoặc ít vận động có thể đang tích lũy. Ưu tiên ngủ, đi bộ và giảm đồ ngọt trong 2 tuần tới.",
    }
  }

  return {
    label: "Tín hiệu lão hóa nhanh",
    accent: "text-rose-700",
    surface: "bg-rose-50 border-rose-200",
    delta: "+7 trở lên",
    copy: "Nhiều yếu tố lối sống đang tạo áp lực lên cơ thể. Nếu mệt mỏi kéo dài, hãy cân nhắc gặp chuyên gia y tế để được đánh giá kỹ hơn.",
  }
}

export function BioAgeWidget() {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)

  const answeredCount = Object.keys(answers).length
  const isComplete = answeredCount === QUESTIONS.length
  const score = useMemo(
    () => Object.values(answers).reduce((total, value) => total + value, 0),
    [answers]
  )
  const result = getResult(score)

  function selectAnswer(questionId: string, value: number) {
    setAnswers((current) => ({ ...current, [questionId]: value }))
    setSubmitted(false)
  }

  function resetQuiz() {
    setAnswers({})
    setSubmitted(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
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
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            {answeredCount}/{QUESTIONS.length} câu đã trả lời
          </p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 sm:w-56">
          <div
            className="h-full bg-rose-600 transition-all"
            style={{ width: `${(answeredCount / QUESTIONS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid gap-4">
        {QUESTIONS.map((question, index) => (
          <fieldset
            key={question.id}
            className="border border-zinc-200 bg-white p-4 md:p-5"
          >
            <legend className="mb-4 flex gap-3 text-base leading-6 font-bold text-zinc-950">
              <span className="inline-flex size-7 flex-shrink-0 items-center justify-center rounded-md bg-zinc-950 text-xs font-black text-white">
                {index + 1}
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
          onClick={() => setSubmitted(true)}
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
          {isComplete ? (
            <div className="space-y-3">
              <p className={`text-sm font-black uppercase ${result.accent}`}>
                {result.label}
              </p>
              <p className="text-3xl font-black text-zinc-950">
                Tuổi sinh học tham khảo: {result.delta} tuổi
              </p>
              <p className="text-sm leading-6 text-zinc-700">{result.copy}</p>
              <p className="text-xs leading-5 text-zinc-500">
                Kết quả chỉ dùng để tự quan sát lối sống, không thay thế xét
                nghiệm y khoa hoặc tư vấn từ bác sĩ.
              </p>
            </div>
          ) : (
            <p className="text-sm font-semibold text-zinc-700">
              Bạn cần trả lời đủ {QUESTIONS.length} câu để xem kết quả.
            </p>
          )}
        </div>
      ) : null}
    </section>
  )
}
