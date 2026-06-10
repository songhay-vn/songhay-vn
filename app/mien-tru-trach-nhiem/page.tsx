import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { DEFAULT_OG_IMAGE_PATH, toAbsoluteUrl } from "@/lib/seo"
import { SiteEngagement } from "@/components/news/site-engagement"
import { getNavCategories } from "@/lib/queries"
import { NewsLayout } from "@/components/news/news-layout"

export const metadata: Metadata = {
  title: "Miễn trừ trách nhiệm",
  description: "Thông tin miễn trừ trách nhiệm khi sử dụng nội dung trên Songhay.vn.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/mien-tru-trach-nhiem",
  },
  openGraph: {
    title: "Miễn trừ trách nhiệm | Songhay.vn",
    description: "Thông tin miễn trừ trách nhiệm khi sử dụng nội dung trên Songhay.vn.",
    type: "article",
    images: [toAbsoluteUrl(DEFAULT_OG_IMAGE_PATH)],
  },
}

export default async function DisclaimerPage() {
  const navCategories = await getNavCategories()

  return (
    <NewsLayout navCategories={navCategories}>
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-rose-700">Songhay.vn</p>
          <h1 className="text-3xl font-black text-zinc-900">Miễn trừ trách nhiệm</h1>
          <p className="text-zinc-600">
            Nội dung trên website được cung cấp nhằm mục đích thông tin tham khảo, không thay thế tư vấn chuyên môn trong các lĩnh vực
            y tế, pháp lý, tài chính hoặc tâm lý.
          </p>
        </header>

        <section className="space-y-3 rounded-lg border border-zinc-200 bg-white p-5 text-zinc-700">
          <h2 className="text-xl font-bold text-zinc-900">Phạm vi thông tin</h2>
          <p>
            Songhay.vn nỗ lực đảm bảo độ chính xác của nội dung tại thời điểm đăng tải, tuy nhiên không cam kết toàn bộ thông tin luôn
            đầy đủ, cập nhật hoặc phù hợp với mọi trường hợp cụ thể.
          </p>
          <p>
            Người dùng chịu trách nhiệm tự đánh giá, kiểm chứng và sử dụng thông tin theo nhu cầu của mình trước khi đưa ra quyết định.
          </p>
        </section>

        <section className="space-y-3 rounded-lg border border-zinc-200 bg-white p-5 text-zinc-700">
          <h2 className="text-xl font-bold text-zinc-900">Giới hạn trách nhiệm</h2>
          <p>
            Songhay.vn không chịu trách nhiệm với bất kỳ thiệt hại trực tiếp hoặc gián tiếp nào phát sinh từ việc sử dụng hoặc không thể
            sử dụng nội dung trên website.
          </p>
          <p>
            Liên kết ngoài (nếu có) chỉ nhằm mục đích tham khảo. Songhay.vn không kiểm soát và không chịu trách nhiệm đối với nội dung,
            chính sách hoặc hoạt động của các website bên thứ ba.
          </p>
        </section>

        <section className="space-y-3 rounded-lg border border-zinc-200 bg-white p-5 text-zinc-700">
          <h2 className="text-xl font-bold text-zinc-900">Liên hệ</h2>
          <p>
            Nếu bạn cần làm rõ nội dung hoặc phản hồi liên quan đến bài viết, vui lòng gửi email tới
            <a href="mailto:lienhesonghay@gmail.com" className="ml-1 font-semibold text-rose-700">lienhesonghay@gmail.com</a>.
          </p>
          <p>
            Chúng tôi luôn cố gắng chọn lọc và cung cấp thông tin từ các nguồn đáng tin cậy, nhưng không tránh khỏi khả năng có thông
            tin chưa thật sự chính xác. Nếu bạn phát hiện bất kỳ thông tin không chính xác nào hoặc bạn có bất kỳ góp ý nào về thông
            tin mà chúng tôi cung cấp, rất mong bạn liên hệ với chúng tôi để chúng tôi có thể sửa đổi và cập nhật thông tin đó.
          </p>
        </section>

        <Link href="/" className="inline-flex text-sm font-semibold text-zinc-700 underline underline-offset-2 hover:text-rose-700">
          Quay về trang chủ
        </Link>

        <Suspense fallback={<div className="h-60 animate-pulse rounded-lg bg-zinc-100" />}>
          <SiteEngagement />
        </Suspense>
      </div>
    </NewsLayout>
  )
}
