import type { Metadata } from "next"
import Link from "next/link"

import { NewsLayout } from "@/components/news/news-layout"
import { getNavCategories } from "@/lib/queries"
import { DEFAULT_OG_IMAGE_PATH, toAbsoluteUrl } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Miễn trừ trách nhiệm & Chính sách quảng cáo | Songhay.vn",
  description:
    "Chính sách quảng cáo, hợp tác thương mại và thông tin miễn trừ trách nhiệm khi sử dụng nội dung trên Songhay.vn.",
  alternates: {
    canonical: "/mien-tru-trach-nhiem",
  },
  openGraph: {
    title: "Miễn trừ trách nhiệm & Chính sách quảng cáo | Songhay.vn",
    description:
      "Chính sách quảng cáo, hợp tác thương mại và thông tin miễn trừ trách nhiệm khi sử dụng nội dung trên Songhay.vn.",
    type: "article",
    images: [toAbsoluteUrl(DEFAULT_OG_IMAGE_PATH)],
  },
}

export default async function DisclaimerPage() {
  const navCategories = await getNavCategories()

  return (
    <NewsLayout navCategories={navCategories}>
      <article className="mx-auto max-w-3xl space-y-8 text-black">
        <header className="space-y-3 border-b border-zinc-200 pb-5">
          <p className="text-sm font-semibold tracking-wide text-rose-700 uppercase">
            Songhay.vn
          </p>
          <h1 className="text-3xl leading-tight font-black text-zinc-950 md:text-4xl">
            Miễn trừ trách nhiệm & Chính sách quảng cáo
          </h1>
          <p className="text-lg leading-relaxed font-medium text-black">
            Sống Hay (Songhay.vn) là nền tảng nội dung cung cấp các bài viết, kiến
            thức và trải nghiệm xoay quanh đời sống, chăm sóc sức khỏe, dưỡng
            sinh, lối sống lành mạnh, khỏe đẹp và giới thiệu các sản phẩm Việt
            phù hợp với định hướng sống tích cực.
          </p>
          <p className="text-black">
            Sống Hay trân trọng sự hợp tác của các doanh nghiệp, hợp tác xã, hộ
            kinh doanh, thương hiệu, nhà sản xuất và đơn vị cung cấp sản phẩm,
            dịch vụ. Tuy nhiên, chúng tôi đặt{" "}
            <strong>tính minh bạch, trung thực và quyền lợi của người đọc</strong>{" "}
            là nguyên tắc ưu tiên trong mọi hoạt động quảng cáo và hợp tác thương
            mại.
          </p>
        </header>

        {/* PHẦN 1: MIỄN TRỪ TRÁCH NHIỆM */}
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-950">
            Miễn trừ trách nhiệm
          </h2>
          <p className="text-black">
            Nội dung trên website được cung cấp nhằm mục đích thông tin tham khảo,
            không thay thế tư vấn chuyên môn trong các lĩnh vực y tế, pháp lý,
            tài chính hoặc tâm lý.
          </p>

          <h3 className="text-xl font-bold text-zinc-900">Phạm vi thông tin</h3>
          <p className="text-black">
            Songhay.vn nỗ lực đảm bảo độ chính xác của nội dung tại thời điểm đăng
            tải, tuy nhiên không cam kết toàn bộ thông tin luôn đầy đủ, cập nhật
            hoặc phù hợp với mọi trường hợp cụ thể.
          </p>
          <p className="text-black">
            Người dùng chịu trách nhiệm tự đánh giá, kiểm chứng và sử dụng thông
            tin theo nhu cầu của mình trước khi đưa ra quyết định.
          </p>

          <h3 className="text-xl font-bold text-zinc-900">
            Giới hạn trách nhiệm
          </h3>
          <p className="text-black">
            Songhay.vn không chịu trách nhiệm với bất kỳ thiệt hại trực tiếp hoặc
            gián tiếp nào phát sinh từ việc sử dụng hoặc không thể sử dụng nội dung
            trên website.
          </p>
          <p className="text-black">
            Liên kết ngoài (nếu có) chỉ nhằm mục đích tham khảo. Songhay.vn không
            kiểm soát và không chịu trách nhiệm đối với nội dung, chính sách hoặc
            hoạt động của các website bên thứ ba.
          </p>
        </section>

        {/* PHẦN 2: PHẠM VI CHÍNH SÁCH */}
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-950">
            Phạm vi chính sách hợp tác thương mại
          </h2>
          <p className="text-black">
            Chính sách này áp dụng đối với các hình thức hợp tác thương mại được
            triển khai trên Songhay.vn, bao gồm nhưng không giới hạn:
          </p>
          <ul className="space-y-2 pl-5">
            <li className="list-disc text-black">
              Bài viết giới thiệu thương hiệu, sản phẩm hoặc dịch vụ.
            </li>
            <li className="list-disc text-black">
              Bài viết hợp tác thương hiệu/tài trợ nội dung.
            </li>
            <li className="list-disc text-black">
              Banner và các vị trí quảng cáo trên website.
            </li>
            <li className="list-disc text-black">
              Giới thiệu sản phẩm Việt, sản phẩm OCOP và sản phẩm từ các nhà sản
              xuất, hợp tác xã, làng nghề.
            </li>
            <li className="list-disc text-black">Nội dung trải nghiệm sản phẩm.</li>
            <li className="list-disc text-black">
              Nội dung phỏng vấn, câu chuyện thương hiệu.
            </li>
            <li className="list-disc text-black">
              Liên kết dẫn tới website, gian hàng hoặc kênh liên hệ chính thức
              của đối tác.
            </li>
            <li className="list-disc text-black">
              Các chương trình hợp tác truyền thông khác được Sống Hay và đối tác
              thống nhất bằng văn bản hoặc phương thức phù hợp.
            </li>
          </ul>
          <p className="text-black">
            Tùy từng chương trình, Sống Hay có thể cung cấp dịch vụ miễn phí hoặc
            có thu phí.
          </p>
        </section>

        {/* NGUYÊN TẮC ĐỘC LẬP VÀ MINH BẠCH */}
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-950">
            Nguyên tắc độc lập và minh bạch
          </h2>
          <p className="text-black">
            Sống Hay phân biệt giữa <strong>nội dung biên tập</strong> và{" "}
            <strong>nội dung có yếu tố thương mại</strong>.
          </p>
          <p className="text-black">
            Việc một thương hiệu, doanh nghiệp hoặc chủ thể sản xuất hợp tác với
            Sống Hay không đồng nghĩa với việc Sống Hay cam kết mọi nội dung về
            thương hiệu hoặc sản phẩm đó đều được đánh giá tích cực.
          </p>
          <p className="text-black">
            Đối với nội dung có tài trợ hoặc có mục đích quảng bá thương mại,
            Sống Hay có thể sử dụng các cách nhận diện phù hợp như:
          </p>
          <ul className="space-y-2 pl-5">
            <li className="list-disc text-black">“Nội dung hợp tác thương hiệu”</li>
            <li className="list-disc text-black">“Bài viết giới thiệu sản phẩm”</li>
            <li className="list-disc text-black">“Nội dung tài trợ”</li>
            <li className="list-disc text-black">“Quảng cáo”</li>
          </ul>
          <p className="text-black">hoặc hình thức nhận diện tương đương.</p>
          <p className="text-black font-semibold">
            Việc nhận quảng cáo hoặc tài trợ không làm thay đổi nguyên tắc của Sống
            Hay về tính trung thực của thông tin được công bố.
          </p>
        </section>

        {/* TIÊU CHÍ TIẾP NHẬN */}
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-950">
            Tiêu chí tiếp nhận quảng cáo và tài trợ
          </h2>
          <p className="text-black">
            Sống Hay có quyền xem xét và lựa chọn đối tác, sản phẩm, dịch vụ trước
            khi đăng tải. Chúng tôi ưu tiên các sản phẩm và thương hiệu:
          </p>
          <ul className="space-y-2 pl-5">
            <li className="list-disc text-black">Có nguồn gốc, xuất xứ rõ ràng.</li>
            <li className="list-disc text-black">
              Có chủ thể sản xuất hoặc kinh doanh xác định.
            </li>
            <li className="list-disc text-black">Có thông tin liên hệ minh bạch.</li>
            <li className="list-disc text-black">
              Tuân thủ các quy định pháp luật có liên quan.
            </li>
            <li className="list-disc text-black">Có thông tin sản phẩm rõ ràng.</li>
            <li className="list-disc text-black">
              Có giấy phép, chứng nhận hoặc hồ sơ cần thiết đối với những sản
              phẩm thuộc nhóm ngành nghề có điều kiện.
            </li>
            <li className="list-disc text-black">
              Có chất lượng và thông tin phù hợp với nội dung được quảng bá.
            </li>
            <li className="list-disc text-black">
              Không sử dụng các tuyên bố gây hiểu nhầm hoặc thổi phồng công dụng.
            </li>
            <li className="list-disc text-black">
              Phù hợp với định hướng nội dung và hình ảnh của Sống Hay.
            </li>
          </ul>
          <p className="text-black">
            Đối với sản phẩm OCOP, Sống Hay ưu tiên các sản phẩm có thông tin xác
            định về chủ thể, địa phương và tình trạng chứng nhận OCOP.
          </p>
          <p className="text-black">
            Sống Hay có quyền từ chối quảng cáo hoặc tài trợ nếu nhận thấy sản
            phẩm, dịch vụ hoặc nội dung quảng cáo không phù hợp với tiêu chí biên
            tập, hình ảnh thương hiệu hoặc quy định pháp luật.
          </p>
        </section>

        {/* TRÁCH NHIỆM CUNG CẤP THÔNG TIN CỦA ĐỐI TÁC */}
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-950">
            Trách nhiệm cung cấp thông tin của đối tác
          </h2>
          <p className="text-black">
            Đối tác chịu trách nhiệm về tính chính xác, hợp pháp và trung thực
            của các thông tin, hình ảnh, tài liệu và hồ sơ cung cấp cho Sống Hay.
            Thông tin có thể bao gồm:
          </p>
          <ul className="grid gap-2 pl-5 sm:grid-cols-2">
            <li className="list-disc text-black">Tên sản phẩm.</li>
            <li className="list-disc text-black">Tên thương hiệu.</li>
            <li className="list-disc text-black">
              Tên doanh nghiệp/hợp tác xã/chủ thể sản xuất.
            </li>
            <li className="list-disc text-black">Địa chỉ.</li>
            <li className="list-disc text-black">Nguồn gốc sản phẩm.</li>
            <li className="list-disc text-black">Thành phần.</li>
            <li className="list-disc text-black">Quy cách.</li>
            <li className="list-disc text-black">
              Chứng nhận, tiêu chuẩn hoặc giải thưởng liên quan.
            </li>
            <li className="list-disc text-black">Thông tin về OCOP nếu có.</li>
            <li className="list-disc text-black">Hướng dẫn sử dụng.</li>
            <li className="list-disc text-black">
              Thông tin giá bán nếu được công bố.
            </li>
            <li className="list-disc text-black">
              Website, số điện thoại, Zalo hoặc kênh bán hàng chính thức.
            </li>
          </ul>
          <p className="text-black">
            Đối tác có trách nhiệm thông báo cho Sống Hay khi những thông tin
            trên thay đổi, hết hiệu lực hoặc không còn phù hợp.
          </p>
          <p className="text-black">
            Sống Hay có quyền yêu cầu đối tác cung cấp tài liệu chứng minh đối với
            những thông tin có tính chất chuyên môn, pháp lý hoặc có khả năng ảnh
            hưởng đáng kể đến quyết định của người tiêu dùng.
          </p>
        </section>

        {/* NỘI DUNG LIÊN QUAN ĐẾN SỨC KHỎE */}
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-950">
            Nội dung liên quan đến sức khỏe
          </h2>
          <p className="text-black">
            Do Sống Hay có chuyên mục về chăm sóc sống khỏe, dưỡng sinh và lối
            sống lành mạnh, chúng tôi đặc biệt thận trọng với nội dung liên quan
            đến sức khỏe. Sống Hay không khuyến khích và không chủ động xây dựng
            nội dung quảng cáo theo hướng:
          </p>
          <ul className="space-y-2 pl-5">
            <li className="list-disc text-black">
              Khẳng định sản phẩm có khả năng chữa bệnh khi sản phẩm không được
              pháp luật xác định là thuốc.
            </li>
            <li className="list-disc text-black">
              Cam kết điều trị hoặc phòng ngừa bệnh một cách tuyệt đối.
            </li>
            <li className="list-disc text-black">
              Đưa ra kết quả sử dụng mang tính bảo đảm.
            </li>
            <li className="list-disc text-black">
              Khuyến khích người đọc tự chẩn đoán hoặc tự điều trị bệnh.
            </li>
            <li className="list-disc text-black">
              Làm cho thực phẩm, thực phẩm bảo vệ sức khỏe, mỹ phẩm hoặc sản phẩm
              thông thường bị hiểu nhầm là thuốc.
            </li>
            <li className="list-disc text-black">
              Sử dụng thông tin sức khỏe gây sợ hãi để thúc đẩy mua hàng.
            </li>
          </ul>
          <p className="text-black">
            Đối với các sản phẩm thuộc lĩnh vực thực phẩm, thực phẩm bảo vệ sức
            khỏe, mỹ phẩm, dược liệu hoặc các nhóm sản phẩm chuyên ngành khác,
            nội dung quảng cáo phải được xem xét theo quy định pháp luật áp dụng
            cho từng loại sản phẩm.
          </p>
          <p className="text-black">
            Sống Hay có quyền yêu cầu đối tác cung cấp tài liệu pháp lý cần thiết
            trước khi đăng tải.
          </p>
        </section>

        {/* SẢN PHẨM OCOP VÀ SẢN PHẨM VIỆT */}
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-950">
            Sản phẩm OCOP và sản phẩm Việt
          </h2>
          <p className="text-black">
            Sống Hay định hướng xây dựng khu vực giới thiệu sản phẩm Việt, sản
            phẩm OCOP, sản phẩm làng nghề, nông sản và các sản phẩm phù hợp với
            lối sống lành mạnh. Việc sản phẩm xuất hiện trên Sống Hay không mặc
            nhiên có nghĩa rằng Sống Hay:
          </p>
          <ul className="space-y-2 pl-5">
            <li className="list-disc text-black">Là nhà sản xuất;</li>
            <li className="list-disc text-black">Là nhà phân phối;</li>
            <li className="list-disc text-black">Là đơn vị chứng nhận chất lượng;</li>
            <li className="list-disc text-black">Là cơ quan xác nhận OCOP;</li>
            <li className="list-disc text-black">
              Hoặc bảo đảm tuyệt đối về chất lượng sản phẩm.
            </li>
          </ul>
          <p className="text-black">
            Thông tin về OCOP, chứng nhận, nguồn gốc hoặc tiêu chuẩn của sản phẩm
            sẽ được trình bày dựa trên tài liệu do chủ thể cung cấp hoặc nguồn
            thông tin có thể kiểm chứng.
          </p>
          <p className="text-black">
            Trong trường hợp phát hiện thông tin không chính xác, hết hiệu lực
            hoặc có dấu hiệu gây hiểu nhầm, Sống Hay có quyền yêu cầu chỉnh sửa,
            tạm ẩn hoặc gỡ nội dung.
          </p>
        </section>

        {/* VAI TRÒ KẾT NỐI NGƯỜI MUA VÀ NGƯỜI BÁN */}
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-950">
            Vai trò của Sống Hay trong việc kết nối người mua và người bán
          </h2>
          <p className="text-black">
            Trong trường hợp Sống Hay chỉ giới thiệu sản phẩm và dẫn người đọc
            tới website, Zalo, fanpage, gian hàng hoặc kênh bán hàng chính thức
            của đối tác, <strong>Sống Hay không trực tiếp tham gia giao dịch</strong>,
            trừ khi có thông báo khác. Khi người dùng được chuyển sang kênh bán
            hàng của đối tác:
          </p>
          <ul className="space-y-2 pl-5">
            <li className="list-disc text-black">
              Đối tác chịu trách nhiệm tư vấn sản phẩm.
            </li>
            <li className="list-disc text-black">
              Đối tác chịu trách nhiệm báo giá.
            </li>
            <li className="list-disc text-black">
              Đối tác chịu trách nhiệm xác nhận đơn hàng.
            </li>
            <li className="list-disc text-black">
              Đối tác chịu trách nhiệm thanh toán.
            </li>
            <li className="list-disc text-black">
              Đối tác chịu trách nhiệm vận chuyển.
            </li>
            <li className="list-disc text-black">
              Đối tác chịu trách nhiệm đổi trả, bảo hành hoặc giải quyết khiếu nại
              liên quan đến giao dịch.
            </li>
          </ul>
          <p className="text-black">
            Người dùng nên kiểm tra thông tin sản phẩm, giá bán, điều kiện giao
            dịch và chính sách của người bán trước khi quyết định mua hàng. Sống
            Hay khuyến khích người dùng ưu tiên các kênh bán hàng chính thức được
            công bố bởi chủ thể sản xuất hoặc đơn vị phân phối.
          </p>
        </section>

        {/* LIÊN KẾT BÊN NGOÀI */}
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-950">
            Liên kết tới website và kênh bán hàng bên ngoài
          </h2>
          <p className="text-black">
            Sống Hay có thể cung cấp liên kết tới: Website của thương hiệu, Zalo,
            Fanpage, Gian hàng thương mại điện tử, Website của nhà sản xuất, hoặc
            các kênh liên hệ và bán hàng chính thức khác. Các liên kết này có thể
            là một phần của hoạt động giới thiệu sản phẩm hoặc hợp tác thương
            mại.
          </p>
          <p className="text-black">
            Sống Hay không chịu trách nhiệm đối với toàn bộ nội dung, chính sách,
            giao dịch hoặc hoạt động phát sinh trên website và nền tảng bên ngoài.
            Người dùng nên đọc kỹ chính sách và điều kiện giao dịch của nền tảng
            hoặc đơn vị bán hàng trước khi cung cấp thông tin hoặc thực hiện giao
            dịch.
          </p>
        </section>

        {/* BÀI VIẾT TRẢI NGHIỆM VÀ ĐÁNH GIÁ */}
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-950">
            Bài viết trải nghiệm và đánh giá sản phẩm
          </h2>
          <p className="text-black">
            Sống Hay có thể thực hiện các nội dung trải nghiệm, giới thiệu hoặc
            đánh giá sản phẩm. Trong trường hợp sản phẩm được cung cấp miễn phí,
            hỗ trợ chi phí hoặc có thỏa thuận thương mại với đối tác, Sống Hay có
            thể công khai mối quan hệ này theo hình thức phù hợp.
          </p>
          <p className="text-black">
            Sống Hay không cam kết mọi trải nghiệm hoặc đánh giá đều tích cực chỉ
            vì sản phẩm được tài trợ. Nội dung trải nghiệm phải phản ánh đúng phạm
            vi trải nghiệm thực tế và không được sử dụng để tạo ra những tuyên bố
            vượt quá thông tin có căn cứ về sản phẩm.
          </p>
        </section>

        {/* BẢN QUYỀN HÌNH ẢNH VÀ TÀI LIỆU */}
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-950">
            Quy định đối với hình ảnh và tài liệu do đối tác cung cấp
          </h2>
          <p className="text-black">
            Đối tác phải bảo đảm rằng mình có quyền sử dụng các hình ảnh, video,
            logo, tài liệu, bài viết và nội dung cung cấp cho Sống Hay. Đối tác
            đồng ý cho Sống Hay sử dụng những tài liệu này trong phạm vi và thời
            gian đã thống nhất để phục vụ hoạt động giới thiệu, quảng bá sản phẩm
            hoặc thương hiệu.
          </p>
          <p className="text-black">
            Nếu phát sinh khiếu nại về quyền sở hữu trí tuệ đối với tài liệu do
            đối tác cung cấp, đối tác có trách nhiệm phối hợp với Sống Hay để giải
            quyết. Sống Hay có quyền yêu cầu thay thế hoặc gỡ bỏ tài liệu khi có
            căn cứ cho rằng tài liệu đó vi phạm quyền của bên thứ ba.
          </p>
        </section>

        {/* QUYỀN CHỈNH SỬA NỘI DUNG */}
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-950">
            Quyền chỉnh sửa nội dung
          </h2>
          <p className="text-black">
            Sống Hay có quyền biên tập, rút gọn, chỉnh sửa cách trình bày, tiêu
            đề hoặc cấu trúc nội dung nhằm bảo đảm:
          </p>
          <ul className="space-y-2 pl-5">
            <li className="list-disc text-black">Tính dễ đọc.</li>
            <li className="list-disc text-black">Tính chính xác.</li>
            <li className="list-disc text-black">
              Tính phù hợp với phong cách của Sống Hay.
            </li>
            <li className="list-disc text-black">Trải nghiệm người đọc.</li>
            <li className="list-disc text-black">
              Tuân thủ quy định pháp luật và chính sách của website.
            </li>
          </ul>
          <p className="text-black">
            Đối với những nội dung có tính chất quảng cáo hoặc được đối tác tài
            trợ, Sống Hay sẽ cố gắng bảo đảm nội dung phù hợp với thông tin đã
            được hai bên thống nhất. Tuy nhiên, Sống Hay không có nghĩa vụ đăng
            nguyên văn tài liệu quảng cáo do đối tác cung cấp.
          </p>
        </section>

        {/* NHỮNG NỘI DUNG KHÔNG TIẾP NHẬN */}
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-950">
            Những nội dung Sống Hay không tiếp nhận
          </h2>
          <p className="text-black">
            Sống Hay có quyền từ chối hoặc ngừng đăng tải các nội dung:
          </p>
          <ul className="space-y-2 pl-5">
            <li className="list-disc text-black">Vi phạm pháp luật.</li>
            <li className="list-disc text-black">
              Có dấu hiệu lừa đảo hoặc gây hiểu nhầm.
            </li>
            <li className="list-disc text-black">
              Quảng cáo sản phẩm không rõ nguồn gốc.
            </li>
            <li className="list-disc text-black">
              Sử dụng thông tin sai lệch về chất lượng, công dụng hoặc nguồn gốc.
            </li>
            <li className="list-disc text-black">Xâm phạm quyền sở hữu trí tuệ.</li>
            <li className="list-disc text-black">
              Quảng cáo thuốc hoặc sản phẩm sức khỏe trái quy định.
            </li>
            <li className="list-disc text-black">
              Khẳng định khả năng chữa bệnh không có căn cứ hoặc không phù hợp với
              quy định.
            </li>
            <li className="list-disc text-black">
              Sử dụng hình ảnh, lời chứng thực giả mạo.
            </li>
            <li className="list-disc text-black">Cam kết hiệu quả tuyệt đối.</li>
            <li className="list-disc text-black">
              Có nội dung phản cảm hoặc không phù hợp với định hướng của Sống Hay.
            </li>
            <li className="list-disc text-black">
              Có nguy cơ gây ảnh hưởng đến sức khỏe, an toàn hoặc quyền lợi chính
              đáng của người tiêu dùng.
            </li>
          </ul>
          <p className="text-black">
            Sống Hay cũng có quyền từ chối quảng cáo đối với bất kỳ sản phẩm hoặc
            dịch vụ nào mà chúng tôi đánh giá là không phù hợp với định hướng phát
            triển của website.
          </p>
        </section>

        {/* HIỂN THỊ QUẢNG CÁO */}
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-950">
            Hiển thị quảng cáo
          </h2>
          <p className="text-black">Quảng cáo có thể được hiển thị tại các vị trí như:</p>
          <ul className="grid gap-2 pl-5 sm:grid-cols-2">
            <li className="list-disc text-black">Trang chủ.</li>
            <li className="list-disc text-black">Trang chuyên mục.</li>
            <li className="list-disc text-black">Trong hoặc giữa các bài viết.</li>
            <li className="list-disc text-black">Cuối bài viết.</li>
            <li className="list-disc text-black">Khu vực giới thiệu sản phẩm.</li>
            <li className="list-disc text-black">Banner.</li>
            <li className="list-disc text-black">
              Các vị trí khác được hai bên thỏa thuận.
            </li>
          </ul>
          <p className="text-black">
            Vị trí, kích thước, thời gian hiển thị và hình thức quảng cáo có thể
            thay đổi tùy từng chương trình hợp tác. Sống Hay có quyền điều chỉnh
            vị trí quảng cáo để bảo đảm trải nghiệm người dùng và hoạt động ổn
            định của website.
          </p>
        </section>

        {/* QUẢNG CÁO VÀ NỘI DUNG BÊN THỨ BA */}
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-950">
            Quảng cáo và nội dung do bên thứ ba cung cấp
          </h2>
          <p className="text-black">
            Sống Hay có thể sử dụng các nền tảng quảng cáo của bên thứ ba, bao
            gồm các hệ thống quảng cáo trực tuyến.
          </p>
          <p className="text-black">
            Việc hiển thị quảng cáo tự động có thể phụ thuộc vào hệ thống của nền
            tảng quảng cáo và không đồng nghĩa với việc Sống Hay trực tiếp lựa
            chọn hoặc xác nhận mọi sản phẩm, dịch vụ xuất hiện trong quảng cáo đó.
          </p>
          <p className="text-black">
            Sống Hay sẽ cố gắng xử lý hoặc báo cáo những quảng cáo mà chúng tôi
            nhận thấy có dấu hiệu vi phạm chính sách hoặc không phù hợp.
          </p>
        </section>

        {/* THAY ĐỔI HOẶC GỠ BỎ NỘI DUNG */}
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-950">
            Thay đổi hoặc gỡ bỏ nội dung quảng cáo
          </h2>
          <p className="text-black">
            Sống Hay có thể tạm dừng, chỉnh sửa hoặc gỡ bỏ nội dung quảng cáo/tài
            trợ trong các trường hợp:
          </p>
          <ul className="space-y-2 pl-5">
            <li className="list-disc text-black">
              Nội dung có thông tin không chính xác.
            </li>
            <li className="list-disc text-black">
              Sản phẩm hoặc dịch vụ có dấu hiệu vi phạm pháp luật.
            </li>
            <li className="list-disc text-black">
              Thông tin chứng nhận không còn hiệu lực.
            </li>
            <li className="list-disc text-black">
              Đối tác cung cấp thông tin sai lệch.
            </li>
            <li className="list-disc text-black">
              Có yêu cầu từ cơ quan có thẩm quyền.
            </li>
            <li className="list-disc text-black">
              Có khiếu nại hợp lý liên quan đến quyền sở hữu trí tuệ.
            </li>
            <li className="list-disc text-black">
              Nội dung gây ảnh hưởng nghiêm trọng đến uy tín hoặc quyền lợi của
              người dùng.
            </li>
            <li className="list-disc text-black">
              Nội dung không còn phù hợp với định hướng hoặc chính sách của Sống
              Hay.
            </li>
          </ul>
          <p className="text-black">
            Trong trường hợp cần thiết, Sống Hay có thể yêu cầu đối tác bổ sung
            tài liệu hoặc giải trình trước khi tiếp tục hiển thị nội dung.
          </p>
        </section>

        {/* TRÁCH NHIỆM CỦA ĐỐI TÁC VÀ SỐNG HAY */}
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-950">
            Trách nhiệm của đối tác
          </h2>
          <p className="text-black">Đối tác chịu trách nhiệm về:</p>
          <ul className="space-y-2 pl-5">
            <li className="list-disc text-black">
              Tính hợp pháp của sản phẩm và dịch vụ.
            </li>
            <li className="list-disc text-black">
              Tính chính xác của thông tin cung cấp.
            </li>
            <li className="list-disc text-black">
              Quyền sở hữu hoặc quyền sử dụng nội dung, hình ảnh, nhãn hiệu.
            </li>
            <li className="list-disc text-black">
              Các giấy phép, chứng nhận hoặc điều kiện kinh doanh cần thiết.
            </li>
            <li className="list-disc text-black">
              Việc thực hiện nghĩa vụ với khách hàng.
            </li>
            <li className="list-disc text-black">
              Chất lượng, an toàn và nguồn gốc sản phẩm theo quy định pháp luật áp
              dụng.
            </li>
          </ul>
          <p className="text-black">
            Việc Sống Hay đăng tải nội dung do đối tác cung cấp không được hiểu
            là Sống Hay thay thế trách nhiệm pháp lý của đối tác đối với sản phẩm
            hoặc dịch vụ.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black text-zinc-950">
            Trách nhiệm của Sống Hay
          </h2>
          <p className="text-black">Sống Hay có trách nhiệm:</p>
          <ul className="space-y-2 pl-5">
            <li className="list-disc text-black">
              Cố gắng kiểm tra và biên tập thông tin trong phạm vi hợp lý.
            </li>
            <li className="list-disc text-black">
              Minh bạch về các nội dung có yếu tố quảng cáo hoặc tài trợ.
            </li>
            <li className="list-disc text-black">
              Không cố ý đăng tải thông tin sai sự thật.
            </li>
            <li className="list-disc text-black">Tôn trọng quyền sở hữu trí tuệ.</li>
            <li className="list-disc text-black">
              Tiếp nhận phản ánh liên quan đến nội dung quảng cáo.
            </li>
            <li className="list-disc text-black">
              Xem xét và xử lý các thông tin có căn cứ về việc nội dung quảng cáo
              không chính xác hoặc vi phạm quy định.
            </li>
          </ul>
          <p className="text-black">
            Tuy nhiên, Sống Hay không thể bảo đảm tuyệt đối tính chính xác của mọi
            thông tin do bên thứ ba cung cấp và không thay thế cơ quan nhà nước
            trong việc chứng nhận chất lượng, nguồn gốc hoặc tính hợp pháp của
            sản phẩm.
          </p>
        </section>

        {/* PHẢN ÁNH & LIÊN HỆ */}
        <section className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-black">
          <h2 className="text-2xl font-black text-zinc-950">
            Phản ánh về quảng cáo và nội dung tài trợ
          </h2>
          <p className="text-black">
            Nếu người dùng phát hiện nội dung quảng cáo hoặc giới thiệu sản phẩm
            trên Songhay.vn có dấu hiệu:
          </p>
          <ul className="space-y-2 pl-5">
            <li className="list-disc text-black">Sai thông tin;</li>
            <li className="list-disc text-black">Thổi phồng công dụng;</li>
            <li className="list-disc text-black">Giả mạo chứng nhận;</li>
            <li className="list-disc text-black">Vi phạm quyền sở hữu trí tuệ;</li>
            <li className="list-disc text-black">
              Không đúng với sản phẩm thực tế;
            </li>
            <li className="list-disc text-black">
              Hoặc có dấu hiệu vi phạm pháp luật,
            </li>
          </ul>
          <p className="text-black font-semibold">
            Vui lòng liên hệ với Sống Hay qua:
          </p>
          <ul className="space-y-2 pl-5">
            <li className="list-disc text-black">
              Email:{" "}
              <a
                href="mailto:lienhesonghay@gmail.com"
                className="font-bold text-rose-700 hover:underline"
              >
                lienhesonghay@gmail.com
              </a>
            </li>
            <li className="list-disc text-black">
              Điện thoại:{" "}
              <a
                href="tel:0967659607"
                className="font-bold text-rose-700 hover:underline"
              >
                0967659607
              </a>
            </li>
            <li className="list-disc text-black">
              Địa chỉ:{" "}
              <span className="font-medium text-black">
                Thôn Tùng Lâm, xã Thư Lâm, Hà Nội
              </span>
            </li>
          </ul>
          <p className="text-black">
            Sống Hay sẽ tiếp nhận và xem xét phản ánh dựa trên thông tin, tài liệu
            được cung cấp.
          </p>
          <div className="border-t border-zinc-200 pt-3 text-sm font-semibold text-zinc-900">
            Sống Hay – Songhay.vn • Cập nhật lần cuối: Ngày 01 tháng 09 năm 2026
          </div>
        </section>

        {/* NGUYÊN TẮC CỦA SỐNG HAY */}
        <section className="space-y-4 rounded-xl border border-rose-200 bg-rose-50/50 p-6 text-black">
          <h2 className="text-2xl font-black text-rose-950">
            Nguyên tắc của Sống Hay
          </h2>
          <p className="text-black">
            Sống Hay không đặt mục tiêu trở thành nơi đăng càng nhiều quảng cáo
            càng tốt. Chúng tôi hướng tới việc xây dựng một không gian nội dung
            đáng tin cậy, nơi người đọc có thể tìm hiểu kiến thức, khám phá những
            câu chuyện đời sống và tiếp cận các sản phẩm Việt có nguồn gốc rõ
            ràng.
          </p>
          <p className="text-black font-semibold">
            Quảng cáo và hợp tác thương mại giúp Sống Hay duy trì hoạt động; nhưng
            niềm tin của người đọc là giá trị lâu dài mà chúng tôi ưu tiên bảo vệ.
          </p>
          <p className="text-lg font-bold text-rose-700">
            Sống Hay – Sống khỏe hơn, sống hay hơn.
          </p>
          <p className="text-sm leading-relaxed text-black">
            Chúng tôi luôn cố gắng chọn lọc và cung cấp thông tin từ các nguồn
            đáng tin cậy, nhưng không tránh khỏi khả năng có thông tin chưa thật sự
            chính xác. Nếu bạn phát hiện bất kỳ thông tin không chính xác nào hoặc
            bạn có bất kỳ góp ý nào về thông tin mà chúng tôi cung cấp, rất mong
            bạn liên hệ với chúng tôi để chúng tôi có thể sửa đổi và cập nhật
            thông tin đó.
          </p>
        </section>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex text-sm font-bold text-zinc-950 underline underline-offset-2 hover:text-rose-700"
          >
            Quay về trang chủ
          </Link>
        </div>
      </article>
    </NewsLayout>
  )
}
