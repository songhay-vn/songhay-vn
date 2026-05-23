import type { Metadata } from "next"
import Link from "next/link"

import { BabyNameWidget } from "@/components/news/baby-name-widget"
import { NewsLayout } from "@/components/news/news-layout"
import { JsonLd } from "@/components/seo/json-ld"
import { getHomepageData, getNavCategories } from "@/lib/queries"

export const metadata: Metadata = {
  title: "Đặt tên con theo Ngũ Hành",
  description:
    "Hướng dẫn đặt tên con theo Ngũ Hành: nguyên tắc tương sinh, cân bằng với mệnh của con, cha mẹ, và ví dụ phân tích tên chi tiết.",
  alternates: {
    canonical: "/dat-ten-cho-con",
  },
}

export default async function BabyNamePage() {
  const [homepageData, navCategories] = await Promise.all([
    getHomepageData(),
    getNavCategories(),
  ])
  const { mostRead } = homepageData
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Đặt tên con theo Ngũ Hành bắt đầu từ đâu?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Nên lấy niên mệnh của bé làm trung tâm, sau đó chọn hành tên thuộc nhóm tương sinh hoặc bình hòa với mệnh của bé.",
        },
      },
      {
        "@type": "Question",
        name: "Có cần xét mệnh của cha và mẹ khi đặt tên không?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Có. Sau khi hợp mệnh bé, nên ưu tiên hành tên giúp cân bằng với niên mệnh cha mẹ để tổng thể gia đạo hài hòa hơn.",
        },
      },
      {
        "@type": "Question",
        name: "Tên lót có vai trò gì trong phong thủy tên gọi?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Tên lót có thể đóng vai trò cầu nối năng lượng giữa họ và tên chính, giúp giảm xung khắc và tăng tính liên kết tương sinh.",
        },
      },
    ],
  }

  return (
    <NewsLayout navCategories={navCategories} trendingPosts={mostRead}>
      <JsonLd data={faqSchema} />
      <div className="space-y-6">
        <h1 className="text-3xl font-black text-zinc-900">
          Đặt tên con theo Ngũ Hành
        </h1>
        <BabyNameWidget />

        <article className="space-y-5 rounded-xl border border-zinc-200 bg-white p-4 md:p-6">
          <section className="space-y-3 text-zinc-700">
            <h2 className="text-2xl font-bold text-zinc-900">
              Vì sao tên gọi quan trọng trong văn hóa phương Đông?
            </h2>
            <p>
              Trong quan niệm truyền thống, Danh (tên gọi) không chỉ để xưng hô
              mà còn mang ý nghĩa năng lượng đi cùng mỗi người suốt đời. Một tên
              đẹp, hợp quy luật Ngũ Hành tương sinh thường được xem là nền tảng
              hỗ trợ sự thuận lợi, may mắn và tâm lý tự tin.
            </p>
            <p>
              Ngược lại, tên thiếu cân bằng với bản mệnh có thể tạo cảm giác
              “lệch pha” về phong thủy. Vì vậy, đặt tên theo Ngũ Hành là một
              hướng tham khảo hữu ích để cha mẹ có thêm cơ sở trước khi chọn tên
              chính thức cho bé.
            </p>
          </section>

          <section className="space-y-3 text-zinc-700">
            <h2 className="text-2xl font-bold text-zinc-900">
              Mục đích tham khảo của chuyên mục
            </h2>
            <p>
              Chuyên mục này giúp phụ huynh nhìn tên gọi theo góc độ hệ thống:
              xét mệnh của bé trước, sau đó đánh giá mức tương sinh với cha mẹ
              và cấu trúc Họ - Tên lót - Tên chính. Mục tiêu là gợi ý một phương
              án đặt tên có tính hài hòa năng lượng, góp phần tạo điểm khởi đầu
              tích cực cho con.
            </p>
          </section>

          <section className="space-y-3 text-zinc-700">
            <h2 className="text-2xl font-bold text-zinc-900">
              Hướng dẫn chọn tên theo Ngũ Hành
            </h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                Lấy niên mệnh của con làm trọng tâm khi chọn hành của tên chính.
              </li>
              <li>
                Ưu tiên các hành tương sinh với mệnh con, sau đó xét đến hành
                bình hòa.
              </li>
              <li>
                So chéo với niên mệnh cha mẹ để chọn phương án hài hòa nhất cho
                gia đình.
              </li>
              <li>
                Nếu có xung khắc giữa Họ và Tên chính, có thể dùng Tên lót như
                một “cầu nối” để chuyển tiếp năng lượng theo hướng mềm hơn.
              </li>
            </ol>
            <p className="rounded-md bg-zinc-50 px-3 py-2 text-sm">
              Ví dụ nhanh: bé mệnh Thủy thường hợp các tên thuộc hành Kim hoặc
              Mộc; trường hợp cần cân bằng có thể cân nhắc thêm hành Thủy (bình
              hòa).
            </p>
          </section>

          <section className="space-y-3 text-zinc-700">
            <h2 className="text-2xl font-bold text-zinc-900">
              Ví dụ phân tích tên tham khảo
            </h2>
            <p className="font-semibold text-zinc-900">
              Tên mẫu: Võ Nguyễn Hồng Phúc
            </p>

            <div className="space-y-2 text-sm">
              <p>- Võ: hành Thủy</p>
              <p>- Nguyễn: hành Mộc</p>
              <p>- Hồng: hành Thủy</p>
              <p>- Phúc: hành Mộc</p>
            </div>

            <div className="space-y-2 text-sm">
              <p>
                1. Quan hệ giữa tên và bản mệnh con (Thủy - Mộc): tương sinh,
                tốt. Điểm: 3/3.
              </p>
              <p>
                2. Quan hệ với mệnh bố (Thủy - Mộc): tương sinh, tốt. Điểm: 2/2.
              </p>
              <p>
                3. Quan hệ với mệnh mẹ (Kim - Mộc): tương khắc, cần lưu ý. Điểm:
                0/2.
              </p>
              <p>
                4. Chuỗi Họ - Tên lót - Tên: có tính liên kết tương sinh theo
                từng nhịp. Điểm: 3/3.
              </p>
              <p>5. Gợi ý quẻ tên (tham khảo): thiên hướng Cát. Điểm: 2/2.</p>
            </div>

            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
              Kết luận mẫu: tổng điểm 10/12, mức khá đẹp. Đây là ví dụ tham khảo
              để cha mẹ hiểu cách chấm theo nhiều lớp tiêu chí trước khi quyết
              định tên cuối cùng.
            </p>
          </section>

          <section className="space-y-3 text-zinc-700">
            <h2 className="text-2xl font-bold text-zinc-900">
              Lưu ý khi dùng công cụ đặt tên
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Phong thủy tên gọi là tài liệu tham khảo, không thay thế tư vấn
                chuyên gia.
              </li>
              <li>
                Ưu tiên tên dễ gọi, ý nghĩa tích cực, phù hợp văn hóa gia đình.
              </li>
              <li>
                Nên cân bằng giữa yếu tố Ngũ Hành và tính thực tiễn khi sử dụng
                hằng ngày.
              </li>
            </ul>
          </section>

          <p className="text-sm text-zinc-500">
            Nguồn tham khảo:{" "}
            <Link
              href="http://XemTuong.net"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="font-semibold text-rose-600 hover:underline"
            >
              XemTuong.net
            </Link>
          </p>
        </article>
      </div>
    </NewsLayout>
  )
}
