import type { Metadata } from "next"
import Link from "next/link"

import { NewsLayout } from "@/components/news/news-layout"
import { getNavCategories } from "@/lib/queries"
import { DEFAULT_OG_IMAGE_PATH, toAbsoluteUrl } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Chính sách bảo mật | Songhay.vn",
  description:
    "Chính sách bảo mật thông tin, cookie, quảng cáo và cam kết bảo vệ quyền riêng tư của người truy cập Songhay.vn.",
  alternates: {
    canonical: "/chinh-sach-bao-mat",
  },
  openGraph: {
    title: "Chính sách bảo mật | Songhay.vn",
    description:
      "Tìm hiểu cách Songhay.vn thu thập, sử dụng và bảo vệ thông tin của người truy cập website.",
    type: "article",
    images: [toAbsoluteUrl(DEFAULT_OG_IMAGE_PATH)],
  },
}

export default async function PrivacyPolicyPage() {
  const navCategories = await getNavCategories()

  return (
    <NewsLayout navCategories={navCategories}>
      <article className="mx-auto max-w-3xl space-y-8 text-zinc-700">
        <header className="space-y-3 border-b border-zinc-200 pb-5">
          <p className="text-sm font-semibold tracking-wide text-rose-700 uppercase">
            Songhay.vn
          </p>
          <h1 className="text-3xl leading-tight font-black text-zinc-900 md:text-4xl">
            Chính sách bảo mật
          </h1>
          <p className="text-lg leading-relaxed text-zinc-700">
            Cám ơn quý khách đã truy cập vào website Songhay.vn. Chúng tôi tôn
            trọng và cam kết sẽ bảo mật những thông tin mang tính riêng tư của
            bạn.
          </p>
        </header>

        <section className="space-y-4">
          <p>
            Xin vui lòng đọc bản Chính sách bảo mật dưới đây để hiểu hơn những
            cam kết mà chúng tôi thực hiện nhằm tôn trọng và bảo vệ quyền lợi
            của người truy cập.
          </p>
          <p className="font-semibold text-zinc-900">
            Chúng tôi cam kết bảo vệ sự riêng tư của người dùng website.
          </p>
          <p>
            Chúng tôi muốn cung cấp một sự trải nghiệm an toàn cho người dùng.
            Những tuyên bố sau đây cam kết quyết tâm của Songhay.vn trong việc
            quản lý thông tin cá nhân và tổ chức trong quá trình thu thập và sử
            dụng.
          </p>
          <p>
            Cam kết bảo mật này chỉ áp dụng cho các dữ liệu thu thập trên trang
            web Songhay.vn (gọi tắt là “website”) và không áp dụng cho bất kỳ
            thông tin trên website khác.
          </p>
          <p>
            Chúng tôi không chịu trách nhiệm về các chính sách bảo mật từ các
            trang web khác mà bạn chọn để liên kết từ trang web của chúng tôi.
            Chúng tôi khuyến khích bạn xem lại chính sách bảo mật của những
            trang web khác để bạn có thể hiểu họ thu thập, sử dụng và chia sẻ
            thông tin của bạn như thế nào.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-900">
            Về thông tin của người truy cập trang web Songhay.vn
          </h2>
          <p>
            Chúng tôi thu thập thông tin về tất cả người truy cập một cách tổng
            quan và không quan tâm đến thông tin chi tiết của từng người dùng,
            ví dụ như khu vực người dùng truy cập thường xuyên nhất và những
            dịch vụ người dùng truy cập nhiều nhất.
          </p>
          <p>
            Những thông tin này giúp chúng tôi xác định những gì là có lợi nhất
            cho các bạn, và làm thế nào để chúng tôi liên tục có thể tạo ra
            những trải nghiệm tốt hơn cho các bạn.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-900">Quảng cáo</h2>
          <p>
            Với tính năng cài đặt quảng cáo, người dùng hoặc khách hàng có thể
            lựa chọn thoát ra khỏi tính năng theo dõi hành vi khách hàng của
            Google Analytics và lựa chọn cách xuất hiện của kênh Hiển Thị Quảng
            Cáo trên Google.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-900">Sử dụng Cookie</h2>
          <p>
            Cookie là tập tin văn bản nhỏ có thể nhận dạng tên truy cập duy nhất
            từ máy tính của bạn đến máy chủ của chúng tôi khi bạn truy cập vào
            các trang nhất định trên website và sẽ được lưu bởi trình duyệt
            internet lên ổ cứng máy tính của bạn.
          </p>
          <p>
            Cookie được dùng để nhận dạng địa chỉ IP, lưu lại thời gian. Chúng
            tôi dùng cookie để tiện cho quý khách vào web và không đòi hỏi bất
            kỳ thông tin nào về bạn. Trình duyệt của bạn có thể được thiết lập
            không sử dụng cookie nhưng điều này sẽ hạn chế quyền sử dụng của bạn
            trên web.
          </p>
          <p>
            Xin vui lòng chấp nhận cam kết của chúng tôi là cookie không bao gồm
            bất cứ chi tiết cá nhân riêng tư nào và an toàn với virus.
          </p>
          <p>
            Trình duyệt này sử dụng Google Analytics, một dịch vụ phân tích web
            được cung cấp bởi Google, Inc. (“Google”). Google Analytics dùng
            cookie, là những tập tin văn bản đặt trong máy tính để giúp website
            phân tích người dùng vào web như thế nào. Thông tin được tổng hợp từ
            cookie sẽ được truyền tới và lưu bởi Google trên các máy chủ tại Hoa
            Kỳ.
          </p>
          <p>
            Google sẽ dùng thông tin này để đánh giá cách dùng web của bạn, lập
            báo cáo về các hoạt động trên web cho các nhà khai thác web và cung
            cấp các dịch vụ khác liên quan đến các hoạt động internet và cách
            dùng internet.
          </p>
          <p>
            Google cũng có thể chuyển giao thông tin này cho bên thứ ba theo yêu
            cầu của pháp luật hoặc các bên thứ ba xử lý thông tin trên danh
            nghĩa của Google. Google sẽ không kết hợp địa chỉ IP của bạn với bất
            kỳ dữ liệu nào khác mà Google đang giữ.
          </p>
          <p>
            Quý khách có thể từ chối dùng cookie bằng cách chọn các thiết lập
            thích hợp trên trình duyệt của mình, tuy nhiên lưu ý rằng điều này
            sẽ ngăn bạn sử dụng triệt để chức năng của website.
          </p>
          <p>
            Bằng cách sử dụng trang web này, bạn đã đồng ý cho Google xử lý dữ
            liệu về bạn theo cách thức và các mục đích nêu trên.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-900">Bảo mật</h2>
          <p>
            Chúng tôi khuyên quý khách rằng quý khách không nên tiết lộ các
            thông tin cá nhân dưới hình thức comment bài viết. Chúng tôi không
            chịu trách nhiệm về những mất mát quý khách có thể gánh chịu trong
            việc trao đổi thông tin của quý khách qua internet hoặc email.
          </p>
          <p>
            Quý khách tuyệt đối không sử dụng bất kỳ chương trình, công cụ hay
            hình thức nào khác để can thiệp vào hệ thống hay làm thay đổi cấu
            trúc dữ liệu. Nghiêm cấm việc phát tán, truyền bá hay cổ vũ cho bất
            kỳ hoạt động nào nhằm can thiệp, phá hoại hay xâm nhập vào dữ liệu
            của hệ thống website.
          </p>
          <p>
            Mọi vi phạm sẽ bị tước bỏ mọi quyền lợi cũng như sẽ bị truy tố trước
            pháp luật nếu cần thiết.
          </p>
          <p>
            Các điều kiện, điều khoản và nội dung của trang web này được điều
            chỉnh bởi luật pháp Việt Nam và tòa án Việt Nam có thẩm quyền xem
            xét.
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
