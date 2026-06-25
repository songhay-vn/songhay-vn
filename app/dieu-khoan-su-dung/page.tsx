import type { Metadata } from "next"
import Link from "next/link"

import { NewsLayout } from "@/components/news/news-layout"
import { getNavCategories } from "@/lib/queries"
import { DEFAULT_OG_IMAGE_PATH, toAbsoluteUrl } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Điều khoản sử dụng | Songhay.vn",
  description:
    "Quy chế cung cấp, trao đổi thông tin và điều khoản sử dụng website Songhay.vn.",
  alternates: {
    canonical: "/dieu-khoan-su-dung",
  },
  openGraph: {
    title: "Điều khoản sử dụng | Songhay.vn",
    description:
      "Tìm hiểu các điều khoản chung, trách nhiệm người dùng và quy chế sử dụng nội dung trên Songhay.vn.",
    type: "article",
    images: [toAbsoluteUrl(DEFAULT_OG_IMAGE_PATH)],
  },
}

const PROHIBITED_ACTS = [
  "Chống lại nhà nước Cộng hòa xã hội chủ nghĩa Việt Nam; gây phương hại đến an ninh quốc gia, trật tự, an toàn xã hội; phá hoại khối đại đoàn kết toàn dân; tuyên truyền chiến tranh xâm lược; gây hận thù, mâu thuẫn giữa các dân tộc, sắc tộc, tôn giáo; tuyên truyền, kích động bạo lực, dâm ô, đồi trụy, tội ác, tệ nạn xã hội, mê tín dị đoan; phá hoại thuần phong, mỹ tục của dân tộc.",
  "Tiết lộ bí mật nhà nước, bí mật quân sự, an ninh, kinh tế, đối ngoại và những bí mật khác đã được pháp luật quy định.",
  "Đưa các thông tin xuyên tạc, vu khống, xúc phạm uy tín của tổ chức; danh dự, nhân phẩm của công dân.",
  "Lợi dụng Internet để quảng cáo, tuyên truyền, mua bán hàng hóa, dịch vụ thuộc danh mục cấm theo quy định của pháp luật.",
  "Truyền bá các tác phẩm báo chí, văn học, nghệ thuật, các xuất bản phẩm vi phạm các quy định của pháp luật.",
  "Cung cấp thông tin vi phạm các quy định về sở hữu trí tuệ, về giao dịch thương mại điện tử và các quy định khác của pháp luật có liên quan.",
  "Gây rối, phá hoại hệ thống thiết bị và cản trở trái pháp luật việc quản lý, cung cấp, sử dụng các dịch vụ Internet và thông tin điện tử trên Internet.",
  "Đánh cắp và sử dụng trái phép mật khẩu, khoá mật mã và thông tin riêng của các tổ chức, cá nhân trên Internet.",
  "Tạo ra và cài đặt các chương trình virus máy tính, phần mềm gây hại để thực hiện một trong những hành vi quy định tại Điều 71 Luật Công nghệ thông tin.",
]

export default async function TermsOfUsePage() {
  const navCategories = await getNavCategories()

  return (
    <NewsLayout navCategories={navCategories}>
      <article className="mx-auto max-w-3xl space-y-8 text-zinc-700">
        <header className="space-y-3 border-b border-zinc-200 pb-5">
          <p className="text-sm font-semibold tracking-wide text-rose-700 uppercase">
            Songhay.vn
          </p>
          <h1 className="text-3xl leading-tight font-black text-zinc-900 md:text-4xl">
            Điều khoản sử dụng
          </h1>
          <p className="text-lg leading-relaxed text-zinc-700">
            Quy chế cung cấp, trao đổi thông tin trên Songhay.vn.
          </p>
          <p>
            Khi truy cập, sử dụng website, quý khách đã mặc nhiên đồng ý với các
            điều khoản và điều kiện đề ra ở đây. Do vậy, đề nghị quý khách đọc
            và nghiên cứu kỹ trước khi sử dụng tiếp.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-900">
            Điều khoản chung
          </h2>
          <h3 className="text-xl font-bold text-zinc-900">
            Chấp thuận các điều kiện sử dụng
          </h3>
          <p>
            Khi sử dụng Website Songhay.vn (gọi tắt là website), Quý khách đã
            mặc nhiên chấp thuận các điều khoản và điều kiện sử dụng (sau đây
            gọi tắt là “Điều kiện sử dụng”) được quy định dưới đây.
          </p>
          <p>
            Để biết được các sửa đổi mới nhất, Quý khách nên thường xuyên kiểm
            tra lại “Điều kiện sử dụng”. Songhay.vn có quyền thay đổi, điều
            chỉnh, thêm hay bớt các nội dung của “Điều kiện sử dụng” tại bất kỳ
            thời điểm nào. Nếu Quý khách vẫn tiếp tục sử dụng Website sau khi có
            các thay đổi như vậy thì có nghĩa là Quý khách đã chấp thuận các
            thay đổi đó.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-900">
            Tính chất của thông tin hiển thị
          </h2>
          <p>
            Các nội dung hiển thị trên Website nhằm mục đích cung cấp thông tin
            về các lĩnh vực sức khỏe, đời sống và các mẹo sống lành trong đời
            sống hiện đại.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-900">Mô tả dịch vụ</h2>
          <p>
            Thông qua Songhay.vn, chúng tôi cung cấp cho người dùng khả năng
            truy nhập đến các tài nguyên trên Web của Songhay.vn, sử dụng các
            dịch vụ Songhay.vn cung cấp, bao gồm các thông tin thể hiện trên
            trang Web dưới dạng văn bản, hình ảnh, âm thanh hoặc clip minh họa,
            cơ sở dữ liệu, các thông báo hoặc thông điệp quản lý và các dịch vụ
            khác (gọi chung là “Dịch Vụ”).
          </p>
          <p>
            Trừ khi có quy định cụ thể khác, đối tượng điều chỉnh của Quy chế
            còn bao gồm cả các bản cập nhật hoặc nâng cấp, các đặc tính hoặc
            thuộc tính mới của Dịch Vụ, hoặc các dịch vụ mới do Songhay.vn cung
            cấp.
          </p>
          <p>
            Dịch vụ trên website này được sẵn sàng thay đổi mà không bắt buộc
            phải thông báo hoặc xác nhận và không bảo đảm Dịch Vụ sẽ thỏa mãn
            yêu cầu, tương thích hoặc phù hợp với mục đích của Người dùng.
          </p>
          <p>
            Trong mọi trường hợp, Songhay.vn không chịu trách nhiệm đối với bất
            kỳ một thiệt hại trực tiếp hoặc gián tiếp nào phát sinh từ việc sử
            dụng Dịch Vụ của Người dùng.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-900">
            Dịch vụ và trách nhiệm của Songhay.vn
          </h2>
          <p>
            Dịch vụ của Songhay.vn là những dịch vụ cung cấp thông tin điện tử
            tổng hợp và tích hợp với mạng xã hội. Bạn đồng ý rằng Songhay.vn có
            quyền điều chỉnh hoặc xoá những thông tin mà bạn comment trên
            website để bảo đảm những thông tin được đăng tải phù hợp với Quy chế
            của website.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-900">
            Trách nhiệm của bạn
          </h2>
          <p>
            Bạn đồng ý rằng không sử dụng Dịch Vụ vào các mục đích phi pháp, bị
            cấm theo quy định của pháp luật (ở đây được ngầm hiểu là Pháp luật
            nước Cộng Hòa Xã hội Chủ nghĩa Việt Nam) hoặc vi phạm các quyền hợp
            pháp, gây trở ngại, hạn chế việc sử dụng Dịch vụ của Người dùng
            khác.
          </p>
          <p>
            Bạn không được gây thiệt hại, phá hoại, làm suy yếu hoặc hư hại Dịch
            Vụ và website của Songhay.vn. Bạn không được phát tán các tập tin
            chứa virus, các chương trình phá hoại, hoặc các tập tin, chương
            trình phần mềm gây hại đến Dịch Vụ và việc sử dụng ổn định của Người
            dùng khác.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-900">
            Các liên kết đến các website khác
          </h2>
          <p>
            Để thuận tiện cho việc sử dụng của Người dùng, Songhay.vn có thể
            cung cấp cho Người dùng một số liên kết đến các website khác. Các
            website liên kết này không thuộc quyền sở hữu của Songhay.vn, do đó
            Songhay.vn sẽ không chịu trách nhiệm về mọi thông tin, dịch vụ và
            nội dung của những Website này. Người dùng chịu hoàn toàn trách
            nhiệm trong việc sử dụng và khai thác các Website này.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-900">
            Giới hạn độ tuổi
          </h2>
          <p>
            Mọi người đều có thể truy cập website này. Tuy nhiên, nếu bạn muốn
            comment, đưa thông tin lên website, bạn phải ít nhất 18 tuổi và có
            đủ khả năng chịu trách nhiệm về hành vi của mình.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-900">Những điều cấm</h2>
          <p>
            Trách nhiệm cá nhân của bạn được xác lập theo Khoản 2, Điều 12, Nghị
            định 97/2008/NĐ-CP ban hành ngày 28 tháng 8 năm 2008 của Chính Phủ
            về Quản lý Internet và Thông tư 07/2008/TT-BTTTT do Bộ Thông tin và
            Truyền thông ban hành ngày 18 tháng 12 năm 2008 hướng dẫn về hoạt
            động cung cấp thông tin trên trang thông tin điện tử cá nhân: “người
            sử dụng phải chịu trách nhiệm về những nội dung thông tin do mình
            đưa vào, lưu trữ, truyền đi trên Internet theo quy định của pháp
            luật”.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-900">
            Các hành vi bị nghiêm cấm
          </h2>
          <h3 className="text-xl font-bold text-zinc-900">
            Lợi dụng Internet nhằm mục đích:
          </h3>
          <ul className="space-y-3 pl-5">
            {PROHIBITED_ACTS.map((item) => (
              <li key={item} className="list-disc">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-900">
            Hình thức xử lý vi phạm
          </h2>
          <p>
            Nếu phát hiện vi phạm của bạn, Songhay.vn sẽ lập tức thực hiện gỡ bỏ
            nội dung vi phạm mà không cần báo trước và gửi thư cảnh báo lần đầu.
            Nếu bạn tiếp tục vi phạm, bạn sẽ nhận được thư cảnh báo thứ hai và
            tài khoản của bạn sẽ khóa vĩnh viễn.
          </p>
          <p>
            Cụ thể hành vi vi phạm được liệt kê bao gồm nhưng không giới hạn
            trong các trường hợp sau đây: vi phạm về đăng thông tin trong nội
            dung bài viết/lời bình; spam nội dung quảng cáo; xúc phạm thành viên
            khác hoặc xúc phạm Ban quản trị website và Songhay.vn.
          </p>
          <p>
            Tùy theo tính chất và mức độ vi phạm của bạn, Songhay.vn sẽ tự xử lý
            vi phạm hoặc phối hợp với cơ quan quản lý nhà nước để xử lý.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-900">
            Sản phẩm và dịch vụ của chủ thể khác
          </h2>
          <p>
            Songhay.vn sẽ không chịu trách nhiệm về bất kỳ sự thiệt hại gây ra
            do sản phẩm dịch vụ được đăng ký hoặc quảng cáo trên website, trực
            tiếp hoặc gián tiếp.
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
