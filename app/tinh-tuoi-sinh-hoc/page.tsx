import type { Metadata } from "next"
import { Activity, HeartPulse, ShieldCheck } from "lucide-react"

import { BioAgeWidget } from "@/components/news/bio-age-widget"
import { JsonLd } from "@/components/seo/json-ld"
import { getNavCategories } from "@/lib/queries"
import { NewsLayout } from "@/components/news/news-layout"
import {
  DEFAULT_OG_IMAGE_PATH,
  getSiteUrl,
  SITE_NAME,
  toAbsoluteUrl,
} from "@/lib/seo"

const pageTitle = "Cách tính tuổi sinh học"
const pageDescription =
  "Làm bài test tuổi sinh học miễn phí để ước tính tuổi sinh học theo tuổi thật, giới tính, giấc ngủ, vận động, dinh dưỡng và stress."
const canonicalPath = "/tinh-tuoi-sinh-hoc"
const siteUrl = getSiteUrl()
const canonicalUrl = `${siteUrl}${canonicalPath}`

export const metadata: Metadata = {
  title: `${pageTitle} | Trắc nghiệm lối sống | ${SITE_NAME}`,
  description: pageDescription,
  alternates: {
    canonical: canonicalPath,
  },
  openGraph: {
    title: `${pageTitle} | ${SITE_NAME}`,
    description: pageDescription,
    type: "website",
    url: canonicalUrl,
    images: [
      {
        url: toAbsoluteUrl(DEFAULT_OG_IMAGE_PATH),
        width: 1200,
        height: 630,
        alt: pageTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${pageTitle} | ${SITE_NAME}`,
    description: pageDescription,
    images: [toAbsoluteUrl(DEFAULT_OG_IMAGE_PATH)],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default async function BioAgePage() {
  const navCategories = await getNavCategories()
  const faqItems = [
    {
      question:
        "Cách tính tuổi sinh học trên Songhay.vn có phải xét nghiệm y khoa không?",
      answer:
        "Không. Đây là bài trắc nghiệm tham khảo dựa trên tuổi thật, giới tính và thói quen lối sống, không thay thế xét nghiệm sinh học, chẩn đoán hoặc tư vấn từ bác sĩ.",
    },
    {
      question: "Bài test tuổi sinh học đánh giá những yếu tố nào?",
      answer:
        "Bài test hỏi về tuổi, giới tính, giấc ngủ, vận động, dinh dưỡng, stress, năng lượng, phục hồi, kết nối xã hội và thói quen theo dõi sức khỏe.",
    },
    {
      question: "Làm sao để cải thiện tuổi sinh học tham khảo?",
      answer:
        "Bạn có thể bắt đầu bằng ngủ đều giờ, tăng vận động vừa sức, ăn nhiều thực phẩm ít chế biến, giảm stress và theo dõi sức khỏe định kỳ.",
    },
  ]

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: pageTitle,
    description: pageDescription,
    inLanguage: "vi-VN",
    isPartOf: {
      "@id": `${siteUrl}#website`,
    },
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }

  return (
      <NewsLayout navCategories={navCategories} className="bg-white">
        <JsonLd data={[webPageJsonLd, faqJsonLd]} />
        <div className="space-y-10 font-serif">
          <section className="grid gap-6 border-b border-zinc-200 pb-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-md bg-rose-50 px-3 py-1.5 text-xs font-black text-rose-700 uppercase">
                <HeartPulse className="size-4" aria-hidden="true" />
                Trắc nghiệm lối sống
              </div>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-4xl leading-tight font-black text-zinc-950 md:text-5xl">
                  Cách tính tuổi sinh học
                </h1>
                <p className="max-w-2xl text-base leading-7 text-zinc-600 md:text-lg">
                  Nhập tuổi thật, giới tính và tự soi lại nhịp phục hồi của cơ
                  thể qua các câu hỏi về giấc ngủ, vận động, dinh dưỡng và
                  stress. Kết quả giúp bạn nhìn nhanh tuổi sinh học tham khảo và
                  chọn một thói quen nhỏ để chăm sóc mình tốt hơn.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="border border-zinc-200 bg-zinc-50 p-3">
                <Activity className="mb-2 size-5 text-emerald-600" />
                <p className="text-sm font-bold text-zinc-950">14 câu hỏi</p>
                <p className="text-xs leading-5 text-zinc-600">
                  Có tuổi, giới tính và thói quen lối sống.
                </p>
              </div>
              <div className="border border-zinc-200 bg-zinc-50 p-3">
                <HeartPulse className="mb-2 size-5 text-rose-600" />
                <p className="text-sm font-bold text-zinc-950">
                  4 nhóm kết quả
                </p>
                <p className="text-xs leading-5 text-zinc-600">
                  Hiển thị thành tuổi sinh học cụ thể.
                </p>
              </div>
              <div className="border border-zinc-200 bg-zinc-50 p-3">
                <ShieldCheck className="mb-2 size-5 text-sky-600" />
                <p className="text-sm font-bold text-zinc-950">Chỉ tham khảo</p>
                <p className="text-xs leading-5 text-zinc-600">
                  Không thay thế xét nghiệm y khoa.
                </p>
              </div>
            </div>
          </section>

          <BioAgeWidget />

          <section className="space-y-4 border-t border-zinc-200 pt-8">
            <h2 className="text-2xl font-black text-zinc-950">
              Câu hỏi thường gặp
            </h2>
            <div className="grid gap-3">
              {faqItems.map((item) => (
                <article
                  key={item.question}
                  className="border border-zinc-200 bg-white p-4"
                >
                  <h3 className="text-base font-bold text-zinc-950">
                    {item.question}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    {item.answer}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </NewsLayout>
  )
}
