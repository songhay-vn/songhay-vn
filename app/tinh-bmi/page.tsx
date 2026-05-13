import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"

import { BmiWidget } from "@/components/news/bmi-widget"
import { JsonLd } from "@/components/seo/json-ld"
import { SiteEngagement } from "@/components/news/site-engagement"
import { getHomepageData, getNavCategories } from "@/lib/queries"
import { NewsLayout } from "@/components/news/news-layout"

export const metadata: Metadata = {
  title: "Đo chỉ số cân nặng - chiều cao (BMI) online",
  description:
    "Đo BMI online, hướng dẫn cách sử dụng chỉ số BMI, bảng phân loại chuẩn cho người lớn và các lưu ý sức khỏe quan trọng.",
  alternates: {
    canonical: "/tinh-bmi",
  },
}

export default async function BmiPage() {
  const [navCategories, homepageData] = await Promise.all([getNavCategories(), getHomepageData()])
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "BMI có phải công cụ chẩn đoán bệnh không?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Không. BMI là công cụ tầm soát ban đầu. Để đánh giá nguy cơ sức khỏe chính xác cần thăm khám và làm thêm các xét nghiệm chuyên sâu.",
        },
      },
      {
        "@type": "Question",
        name: "Chỉ số BMI bao nhiêu là bình thường ở người lớn?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Theo phân loại chuẩn người lớn từ 20 tuổi trở lên, BMI từ 18.5 đến dưới 25 được xem là bình thường.",
        },
      },
      {
        "@type": "Question",
        name: "BMI thấp hoặc cao gây nguy cơ gì?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "BMI thấp có thể liên quan suy dinh dưỡng và miễn dịch suy yếu. BMI cao làm tăng nguy cơ tim mạch, tăng huyết áp, rối loạn đường huyết, đột quỵ và một số bệnh mạn tính.",
        },
      },
    ],
  }

  return (
    <>
      <JsonLd data={faqSchema} />
      <NewsLayout navCategories={navCategories} trendingPosts={homepageData.mostRead} className="bg-white">
        <div className="space-y-6">
          <h1 className="text-3xl font-black text-zinc-900">Đo chỉ số cân nặng - chiều cao (BMI) online</h1>
          <BmiWidget />

          <article className="space-y-5 rounded-xl border border-zinc-200 bg-white p-4 md:p-6">
            <section className="space-y-3 text-zinc-700">
              <h2 className="text-2xl font-bold text-zinc-900">BMI là gì và có ý nghĩa như thế nào?</h2>
              <p>
                BMI không đo trực tiếp mỡ cơ thể, nhưng nhiều nghiên cứu cho thấy BMI có tương quan với tỷ lệ mỡ ở mức
                cộng đồng. Vì vậy, BMI là phương pháp đơn giản, chi phí thấp và dễ thực hiện để tầm soát nhanh nguy cơ sức
                khỏe liên quan đến cân nặng.
              </p>
            </section>

            <section className="space-y-3 text-zinc-700">
              <h2 className="text-2xl font-bold text-zinc-900">1. Sử dụng BMI như thế nào?</h2>
              <p>
                BMI được dùng như công cụ tầm soát để xác định mức cân nặng phù hợp ở người lớn. Đây không phải công cụ
                chẩn đoán. Nếu BMI cao hoặc thấp bất thường, bác sĩ thường kết hợp thêm các đánh giá khác như chế độ ăn,
                hoạt động thể lực, tiền sử gia đình, xét nghiệm và sàng lọc y khoa.
              </p>
            </section>

            <section className="space-y-3 text-zinc-700">
              <h2 className="text-2xl font-bold text-zinc-900">
                2. Vì sao CDC sử dụng BMI để đánh giá thừa cân và béo phì?
              </h2>
              <p>
                Theo thực hành cộng đồng, BMI là cách tiếp cận hiệu quả để đánh giá thừa cân và béo phì vì chỉ cần hai chỉ
                số cơ bản: chiều cao và cân nặng. Điều này giúp so sánh tình trạng cân nặng của một cá nhân với quần thể
                chung một cách nhanh và nhất quán.
              </p>
              <p className="rounded-md bg-zinc-50 px-3 py-2 text-sm">
                Công thức: BMI = cân nặng (kg) / (chiều cao (m) × chiều cao (m)).
              </p>
            </section>

            <section className="space-y-3 text-zinc-700">
              <h2 className="text-2xl font-bold text-zinc-900">Cách đánh giá chỉ số BMI ở người lớn</h2>
              <p>
                Đối với người từ 20 tuổi trở lên, có thể dùng cùng một bảng phân loại chuẩn cho cả nam và nữ:
              </p>
              <div className="grid gap-2 text-sm md:grid-cols-2">
                <p>- BMI &lt; 16: Gầy độ III</p>
                <p>- 16 ≤ BMI &lt; 17: Gầy độ II</p>
                <p>- 17 ≤ BMI &lt; 18.5: Gầy độ I</p>
                <p>- 18.5 ≤ BMI &lt; 25: Bình thường</p>
                <p>- 25 ≤ BMI &lt; 30: Thừa cân</p>
                <p>- 30 ≤ BMI &lt; 35: Béo phì độ I</p>
                <p>- 35 ≤ BMI &lt; 40: Béo phì độ II</p>
                <p>- BMI ≥ 40: Béo phì độ III</p>
              </div>
            </section>

            <section className="space-y-3 text-zinc-700">
              <h2 className="text-2xl font-bold text-zinc-900">3. Nguy cơ khi chỉ số BMI thấp</h2>
              <p>
                BMI thấp hơn 18.5 có thể liên quan đến tình trạng gầy, thiếu cân, suy dinh dưỡng, giảm mật độ xương và suy
                giảm miễn dịch. Người có BMI thấp kéo dài nên được tư vấn dinh dưỡng và kiểm tra sức khỏe định kỳ.
              </p>
            </section>

            <section className="space-y-3 text-zinc-700">
              <h2 className="text-2xl font-bold text-zinc-900">4. Nguy cơ khi chỉ số BMI cao</h2>
              <p>
                BMI từ 25 trở lên làm tăng nguy cơ các bệnh tim mạch, tăng huyết áp, rối loạn đường huyết, đột quỵ và một
                số bệnh mạn tính khác. Việc điều chỉnh ăn uống, vận động và theo dõi y khoa sớm có thể giúp giảm nguy cơ.
              </p>
            </section>

            <section className="space-y-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-zinc-700">
              <h2 className="text-lg font-bold text-zinc-900">Lưu ý miễn trừ trách nhiệm</h2>
              <p className="text-sm">
                Bảng tính BMI chỉ mang tính chất tham khảo, dựa trên công thức chung theo chiều cao và cân nặng. Kết quả
                không phản ánh đầy đủ thành phần cơ thể (mỡ, cơ, xương), bệnh lý nền hoặc các nguy cơ tiềm ẩn khác, và
                không thay thế chẩn đoán hoặc tư vấn chuyên môn tại cơ sở y tế.
              </p>
              <p className="text-sm">
                Để được đánh giá chính xác, người dùng nên thăm khám trực tiếp với bác sĩ hoặc chuyên gia y tế.
              </p>
              <p className="text-sm">
                Xem thêm: <Link href="/mien-tru-trach-nhiem" className="font-semibold text-rose-600 hover:underline">Miễn trừ trách nhiệm</Link>
              </p>
            </section>
          </article>

          <Suspense fallback={<div className="h-60 animate-pulse rounded-lg bg-zinc-100" />}>
            <SiteEngagement />
          </Suspense>
        </div>
      </NewsLayout>
    </>
  )
}
