"use client"

import { useMemo, useState } from "react"

const maleNames = ["Minh Quân", "Gia Huy", "Anh Khoa", "Bảo Long", "Đức Trí"]
const femaleNames = ["Minh Anh", "Bảo Ngọc", "Khánh Linh", "Phương Nhi", "Gia Hân"]
const neutralNames = ["An Nhiên", "Gia An", "Thiên Phúc", "Minh Khang", "Bảo Châu"]

type Gender = "boy" | "girl" | "neutral"

export function BabyNameWidget() {
  const [lastName, setLastName] = useState("Nguyễn")
  const [gender, setGender] = useState<Gender>("neutral")
  const [keyword, setKeyword] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const suggestions = useMemo(() => {
    const source = gender === "boy" ? maleNames : gender === "girl" ? femaleNames : neutralNames
    const filtered = keyword.trim().length > 0
      ? source.filter((name) => name.toLowerCase().includes(keyword.trim().toLowerCase()))
      : source

    return filtered.slice(0, 5).map((name) => `${lastName.trim() || "Nguyễn"} ${name}`)
  }, [gender, keyword, lastName])

  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="text-xl font-bold text-zinc-900">Gợi ý đặt tên cho con</h3>

      <label className="block text-sm font-medium text-zinc-700">
        Họ
        <input
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          type="text"
          className="mt-1 w-full border border-zinc-300 px-3 py-2"
          placeholder="Nguyễn"
        />
      </label>

      <label className="block text-sm font-medium text-zinc-700">
        Giới tính dự kiến
        <select
          value={gender}
          onChange={(event) => setGender(event.target.value as Gender)}
          className="mt-1 w-full border border-zinc-300 px-3 py-2"
        >
          <option value="boy">Bé trai</option>
          <option value="girl">Bé gái</option>
          <option value="neutral">Trung tính</option>
        </select>
      </label>

      <label className="block text-sm font-medium text-zinc-700">
        Từ khóa mong muốn (tùy chọn)
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          type="text"
          className="mt-1 w-full border border-zinc-300 px-3 py-2"
          placeholder="An, Minh, Gia..."
        />
      </label>

      <button
        type="button"
        className="h-10 w-full rounded-none bg-rose-600 text-sm font-semibold text-white hover:bg-rose-700"
        onClick={() => setSubmitted(true)}
      >
        Gợi ý tên
      </button>

      {submitted ? (
        <div className="space-y-2 border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {suggestions.length > 0 ? (
            suggestions.map((name) => <p key={name}>• {name}</p>)
          ) : (
            <p>Không tìm thấy tên phù hợp với từ khóa. Thử từ khóa khác nhé.</p>
          )}
          <p className="text-xs text-zinc-900 font-medium">Tên chỉ mang tính tham khảo để lấy ý tưởng.</p>
        </div>
      ) : null}
    </section>
  )
}
