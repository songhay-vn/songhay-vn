import type { Metadata } from "next"
import Link from "next/link"

import { NewsLayout } from "@/components/news/news-layout"
import { getNavCategories } from "@/lib/queries"
import { DEFAULT_OG_IMAGE_PATH, toAbsoluteUrl } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Về chúng tôi | Songhay.vn",
  description:
    "Thông tin về đội ngũ ban biên tập, định hướng nội dung và chính sách biên tập của Songhay.vn.",
  alternates: {
    canonical: "/ve-chung-toi",
  },
  openGraph: {
    title: "Về chúng tôi | Songhay.vn",
    description:
      "Tìm hiểu đội ngũ ban biên tập và cách Songhay.vn chọn lọc, kiểm chứng nội dung sức khỏe, đời sống.",
    type: "article",
    images: [toAbsoluteUrl(DEFAULT_OG_IMAGE_PATH)],
  },
}

const EDITORS = [
  "Thu Trang",
  "Hoàng Tuấn",
  "Lệ Trà",
  "Ngọc Hải",
  "Thu Hoài",
  "Ngọc Quỳnh",
]

export default async function AboutPage() {
  const navCategories = await getNavCategories()

  return (
    <NewsLayout navCategories={navCategories}>
      <article className="mx-auto max-w-3xl space-y-8 text-zinc-700">
        <header className="space-y-3 border-b border-zinc-200 pb-5">
          <p className="text-sm font-semibold tracking-wide text-rose-700 uppercase">
            Songhay.vn
          </p>
          <h1 className="text-3xl leading-tight font-black text-zinc-900 md:text-4xl">
            Về chúng tôi
          </h1>
          <p className="text-lg leading-relaxed text-zinc-700">
            Sống Hay được xây dựng bởi nhóm biên tập viên yêu thích lối sống
            thuận tự nhiên, với kinh nghiệm nhiều năm trong lĩnh vực nội dung
            đời sống và sức khỏe.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-900">
            Đội ngũ ban biên tập Sống Hay
          </h2>
          <ul className="grid gap-2 pl-5 text-zinc-800 sm:grid-cols-2">
            {EDITORS.map((editor) => (
              <li key={editor} className="list-disc">
                {editor}
              </li>
            ))}
            <li className="list-disc">Cùng các cộng sự biên tập khác</li>
          </ul>
          <p>
            Đây đều là những BTV có nhiều năm kinh nghiệm trong lĩnh vực báo chí
            điện tử về mảng bài sức khỏe.
          </p>
          <p>
            Người dày dặn nhất có 13 năm công tác trong lĩnh vực báo chí, từng
            làm ở Thương hiệu &amp; Pháp luật, xahoi.com.vn, Ngôi Sao và nhiều
            đơn vị nội dung khác.
          </p>
          <p>
            Đội ngũ có kỹ năng dịch, viết, tổng hợp và phân tích tin một cách
            khách quan để gửi đến độc giả.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-900">
            Định hướng nội dung
          </h2>
          <p>
            Ban biên tập Sống Hay (Songhay.vn) hướng đến nội dung chính là sức
            khỏe và đời sống. Chúng tôi cung cấp thông tin về lối sống thuận tự
            nhiên, sống chậm, sống lành, và các phương pháp chăm sóc sức khỏe tự
            nhiên.
          </p>

          <div className="space-y-3">
            <p className="font-semibold text-zinc-900">
              Chúng tôi lấy thông tin từ 3 nguồn:
            </p>
            <ol className="space-y-3 pl-5">
              <li className="list-decimal">
                Trang tin, báo nước ngoài uy tín về sức khỏe cũng như lối sống
                xanh từ tư vấn của bác sĩ, dược sĩ y khoa có tầm quốc tế như:
                Healthline, Aboluowang, WebMD, China Times, Sina...
              </li>
              <li className="list-decimal">
                Thông tin từ những trang cá nhân của các bác sĩ, lương y uy tín
                ở Việt Nam như: PGS.TS Nguyễn Lân Hiếu, bác sĩ Lê Hữu Tuấn là
                Thầy thuốc ưu tú, chuyên gia chăm sóc sức khỏe Thương Yêu, bác
                sĩ Trần Hải Long, bác sĩ Khánh, lương y Đỗ Minh Tuấn, bác sĩ
                Dương Minh Tuấn...
              </li>
              <li className="list-decimal">
                Thông tin sức khỏe từ Bộ Y tế, chuyên trang Sức khỏe &amp; Đời
                sống, VnExpress, Người Lao Động và nhiều trang lớn để đối chiếu,
                kiểm chứng.
              </li>
            </ol>
          </div>

          <p>
            Nhằm cung cấp cho độc giả thông tin dễ đọc, dễ hiểu, gần gũi. Từ đó
            có góc nhìn đúng và ứng dụng vào thực tế cuộc sống.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-900">
            Chính sách biên tập
          </h2>
          <p>
            Mọi bài viết trên Sống Hay đều phải trải qua 3 bước kiểm duyệt:
            nghiên cứu tài liệu chính thống, biên tập bởi nhà báo chuyên trách,
            kiểm chứng bởi chuyên gia trước khi xuất bản.
          </p>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl font-black text-zinc-900">
            Miễn trừ trách nhiệm
          </h2>

          <div className="space-y-3">
            <h3 className="text-xl font-bold text-zinc-900">
              Phạm vi thông tin
            </h3>
            <p>
              Songhay.vn nỗ lực đảm bảo độ chính xác của nội dung tại thời điểm
              đăng tải, tuy nhiên không cam kết toàn bộ thông tin luôn đầy đủ,
              cập nhật hoặc phù hợp với mọi trường hợp cụ thể.
            </p>
            <p>
              Người dùng chịu trách nhiệm tự đánh giá, kiểm chứng và sử dụng
              thông tin theo nhu cầu của mình trước khi đưa ra quyết định.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-bold text-zinc-900">
              Giới hạn trách nhiệm
            </h3>
            <p>
              Songhay.vn không chịu trách nhiệm với bất kỳ thiệt hại trực tiếp
              hoặc gián tiếp nào phát sinh từ việc sử dụng hoặc không thể sử
              dụng nội dung trên website.
            </p>
            <p>
              Liên kết ngoài (nếu có) chỉ nhằm mục đích tham khảo. Songhay.vn
              không kiểm soát và không chịu trách nhiệm đối với nội dung, chính
              sách hoặc hoạt động của các website bên thứ ba.
            </p>
          </div>
        </section>

        <section className="space-y-4 border-t border-zinc-200 pt-6">
          <h2 className="text-2xl font-black text-zinc-900">Liên hệ</h2>
          <p>
            Nếu bạn cần làm rõ nội dung hoặc phản hồi liên quan đến bài viết,
            vui lòng gửi email tới{" "}
            <a
              href="mailto:lienhesonghay@gmail.com"
              className="font-semibold text-rose-700 underline underline-offset-2 hover:text-rose-800"
            >
              lienhesonghay@gmail.com
            </a>
            .
          </p>
          <p>
            Chúng tôi luôn cố gắng chọn lọc và cung cấp thông tin từ các nguồn
            đáng tin cậy, nhưng không tránh khỏi khả năng có thông tin chưa thật
            sự chính xác. Nếu bạn phát hiện bất kỳ thông tin không chính xác nào
            hoặc bạn có bất kỳ góp ý nào về thông tin mà chúng tôi cung cấp, rất
            mong bạn liên hệ với chúng tôi để chúng tôi có thể sửa đổi và cập
            nhật thông tin đó.
          </p>
          <p className="font-semibold text-zinc-900">
            Khi nói đến sức khỏe của bạn, sự chính xác, lòng tin và tính xác
            thực là vô cùng quan trọng, và bạn xứng đáng được hưởng những điều
            tốt đẹp nhất.
          </p>
        </section>

        <Link
          href="/"
          className="inline-flex text-sm font-semibold text-zinc-700 underline underline-offset-2 hover:text-rose-700"
        >
          Quay về trang chủ
        </Link>
      </article>
    </NewsLayout>
  )
}
