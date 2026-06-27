export type BioAgeGenderValue = "MALE" | "FEMALE"

export type BioAgeResultKey = "YOUNGER" | "BALANCED" | "RECOVERY" | "FAST_AGING"

export type BioAgeResult = {
  key: BioAgeResultKey
  label: string
  accent: string
  surface: string
  deltaLabel: string
  deltaMin: number
  deltaMax: number | null
  copy: string
}

export type EstimatedBioAge = {
  min: number
  max: number | null
  label: string
}

export const BIO_AGE_MIN_AGE = 1
export const BIO_AGE_MAX_AGE = 120
export const BIO_AGE_MAX_SCORE = 36

export function getBioAgeResult(score: number): BioAgeResult {
  if (score <= 8) {
    return {
      key: "YOUNGER",
      label: "Nhịp sinh học trẻ hơn",
      accent: "text-emerald-700",
      surface: "bg-emerald-50 border-emerald-200",
      deltaLabel: "-2 đến -5",
      deltaMin: -5,
      deltaMax: -2,
      copy: "Các thói quen nền tảng đang hỗ trợ phục hồi tốt. Tiếp tục giữ nhịp ngủ, vận động và bữa ăn ổn định.",
    }
  }

  if (score <= 18) {
    return {
      key: "BALANCED",
      label: "Đang cân bằng",
      accent: "text-sky-700",
      surface: "bg-sky-50 border-sky-200",
      deltaLabel: "-1 đến +2",
      deltaMin: -1,
      deltaMax: 2,
      copy: "Cơ thể có nền tảng khá ổn nhưng vẫn còn vài điểm kéo tuổi sinh học lên. Chọn một thói quen dễ nhất để cải thiện trước.",
    }
  }

  if (score <= 26) {
    return {
      key: "RECOVERY",
      label: "Cần phục hồi",
      accent: "text-amber-700",
      surface: "bg-amber-50 border-amber-200",
      deltaLabel: "+3 đến +6",
      deltaMin: 3,
      deltaMax: 6,
      copy: "Dấu hiệu thiếu ngủ, stress hoặc ít vận động có thể đang tích lũy. Ưu tiên ngủ, đi bộ và giảm đồ ngọt trong 2 tuần tới.",
    }
  }

  return {
    key: "FAST_AGING",
    label: "Tín hiệu lão hóa nhanh",
    accent: "text-rose-700",
    surface: "bg-rose-50 border-rose-200",
    deltaLabel: "+7 trở lên",
    deltaMin: 7,
    deltaMax: null,
    copy: "Nhiều yếu tố lối sống đang tạo áp lực lên cơ thể. Nếu mệt mỏi kéo dài, hãy cân nhắc gặp chuyên gia y tế để được đánh giá kỹ hơn.",
  }
}

export function calculateEstimatedBioAge(
  chronologicalAge: number,
  result: Pick<BioAgeResult, "deltaMin" | "deltaMax">
): EstimatedBioAge {
  const min = Math.max(BIO_AGE_MIN_AGE, chronologicalAge + result.deltaMin)
  const max =
    result.deltaMax === null
      ? null
      : Math.max(BIO_AGE_MIN_AGE, chronologicalAge + result.deltaMax)

  if (max === null) {
    return {
      min,
      max,
      label: `từ ${min} tuổi trở lên`,
    }
  }

  if (min === max) {
    return {
      min,
      max,
      label: `${min} tuổi`,
    }
  }

  return {
    min,
    max,
    label: `${min}-${max} tuổi`,
  }
}

export function getAgeGroup(age: number) {
  if (age <= 17) return "1-17"
  if (age <= 24) return "18-24"
  if (age <= 34) return "25-34"
  if (age <= 44) return "35-44"
  if (age <= 54) return "45-54"
  if (age <= 64) return "55-64"
  return "65+"
}
