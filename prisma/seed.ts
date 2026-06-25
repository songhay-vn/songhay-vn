import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"

import { NAV_CATEGORIES } from "../lib/categories"
import { hashPassword } from "../lib/password"
import { normalizePenName, toPenNameDisplayName } from "../lib/pen-names"
import { slugify } from "../lib/slug"
import { DEFAULT_PERMISSIONS, ALL_EDITABLE_ROLES, ALL_PERMISSION_ACTIONS } from "../lib/permissions"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL || "" }),
})

type SeedPost = {
  categorySlug: string
  title: string
  excerpt: string
  content: string
  thumbnailUrl: string
  videoEmbedUrl?: string
  isFeatured?: boolean
  isTrending?: boolean
  views: number
}

const demoPosts: SeedPost[] = [
  {
    categorySlug: "chuyen-hay",
    title: "5 thoi quen buoi sang giup ngay moi nhe nhang hon",
    excerpt: "Chi can 20 phut buoi sang, ban co the cai thien nang luong va tam trang ro ret.",
    content:
      "Bat dau ngay moi voi 5 thoi quen don gian: uong nuoc am, van dong nhe, ghi 3 dieu biet on, an sang can bang va sap xep 3 viec quan trong. Cach lam nay giup giam cang thang, tang kha nang tap trung va giu tinh than on dinh trong suot ngay.",
    thumbnailUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1400&q=80",
    isFeatured: true,
    isTrending: true,
    views: 2430,
  },
  {
    categorySlug: "hot-tren-mang",
    title: "Nghe thuat noi chuyen de tao thien cam trong 3 phut dau",
    excerpt: "Khong can hoa my, chi can dung cach dat cau hoi va lang nghe chu dong.",
    content:
      "Trong 3 phut dau tien, hay dung ten nguoi doi dien, dat cau hoi mo va phan hoi ngan gon de the hien su quan tam. Tu the mo, mat huong ve doi dien va toc do noi cham vua du giup cuoc tro chuyen tro nen de chiu va tao cam giac tin cay hon.",
    thumbnailUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80",
    isFeatured: true,
    views: 1760,
  },
  {
    categorySlug: "chuyen-hay",
    title: "Lam viec tai nha khong met moi voi quy tac 50 10",
    excerpt: "Sau moi 50 phut tap trung, nghi 10 phut de bo nao duoc nap lai nang luong.",
    content:
      "Quy tac 50 10 giup ngan met moi tri tue va duy tri hieu suat on dinh. Trong 10 phut nghi, tranh luot mang xa hoi, hay uong nuoc, nhin xa 20 met va van dong co vai gay. Sau 1 tuan ap dung, ban se thay tinh trang qua tai giam ro.",
    thumbnailUrl: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1400&q=80",
    isFeatured: true,
    views: 1325,
  },
  {
    categorySlug: "kham-pha",
    title: "Song toi gian giua thanh pho: it do hon, nhieu niem vui hon",
    excerpt: "Toi gian khong phai la cat bo, ma la giu lai dieu quan trong nhat.",
    content:
      "Hay bat dau bang viec sap xep lai goc ban lam viec, loai bo do vat khong dung 30 ngay va dat quy tac mua sam 1 vao 1 ra. Ban se tiet kiem thoi gian, giam ap luc tinh than va co nhieu khong gian cho nhung trai nghiem gia tri.",
    thumbnailUrl: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=1400&q=80",
    isFeatured: true,
    views: 1980,
  },
  {
    categorySlug: "khoe-dep",
    title: "Duong sinh 15 phut truoc khi ngu de ngu sau giac",
    excerpt: "Chuoi dong tac tho, keo gian co va tha long giup co the vao trang thai nghi ngoi nhanh hon.",
    content:
      "Truoc gio ngu 30 phut, tat man hinh xanh, tho 4 6, xoay co vai nhe va keo gian lung hong. Ket hop am nhac nhe va phong ngu mat me se giup chat luong giac ngu cai thien ro. Day la bai duong sinh don gian, phu hop moi lua tuoi.",
    thumbnailUrl: "https://images.unsplash.com/photo-1477332552946-cfb384aeaf1c?auto=format&fit=crop&w=1400&q=80",
    isTrending: true,
    views: 2860,
  },
  {
    categorySlug: "khoe-dep",
    title: "Thuc duong trong 7 ngay: goi y bua an can bang de de ap dung",
    excerpt: "Thay doi nho trong bua an co the giup tieu hoa em hon va giam cam giac met.",
    content:
      "Tang rau xanh 2 bua moi ngay, uu tien ngu coc nguyen hat, dam thuc vat va giam duong tinh luyen. Ke hoach 7 ngay nham tao nen tang ben vung, khong ep can. Ban co the dieu chinh khau vi theo thoi quen gia dinh de duy tri lau dai.",
    thumbnailUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1400&q=80",
    views: 1642,
  },
  {
    categorySlug: "cham-con",
    title: "Lich van nien va nhung khung gio de tap luyen hieu qua",
    excerpt: "Co the moi nguoi co nhip sinh hoc rieng, nhung co nhung moc gio de de bat nhip.",
    content:
      "Buoi sang som phu hop cardio nhe, buoi chieu toi uu cho bai tap suc manh. Theo doi nang luong trong 2 tuan de tim khung gio vang cua rieng ban. Luyen tap dung luc giup giam bo cuoc va tao tien do on dinh hon.",
    thumbnailUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1400&q=80",
    views: 1210,
  },
  {
    categorySlug: "khoe-dep",
    title: "3 bai tap tai nha khong dung cu cho nguoi ban ron",
    excerpt: "Chi can 12 phut moi ngay de duy tri suc ben va su linh hoat.",
    content:
      "Bo 3 bai tap gom squat, plank va lunges co the thuc hien tai nha ma khong can dung cu. Moi bai 40 giay, nghi 20 giay, lap lai 3 vong. Cach nay phu hop nguoi ban ron va de duy tri than hinh can doi.",
    thumbnailUrl: "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?auto=format&fit=crop&w=1400&q=80",
    views: 1954,
  },
  {
    categorySlug: "meo-nau-an",
    title: "Meo sap xep tu lanh 10 phut tiet kiem nua gio nau an",
    excerpt: "Phan tang thuc pham thong minh se giup ban nau nhanh va giam lang phi.",
    content:
      "Dat rau cu de thay o tang giua, do an da che bien o hop trong suot va dan nhan ngay mo nap. Moi toi thu 2, danh 10 phut kiem tra han su dung de len ke hoach bua an. Ban se giam bo thuc pham va de dang mua sam dung nhu cau.",
    thumbnailUrl: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1400&q=80",
    isTrending: true,
    views: 3045,
  },
  {
    categorySlug: "meo-gia-dinh",
    title: "Cach giat trang quan ao ma khong can chat tay manh",
    excerpt: "Ket hop nguyen lieu san co trong bep de xu ly vet ban nhe an toan hon.",
    content:
      "Hoa tan bot baking soda voi nuoc am, ngam 20 phut truoc khi giat. Vet mau vang co the xu ly bang oxy gia loang theo ti le phu hop. Luon thu tren goc vai nho truoc de dam bao chat lieu khong bi anh huong.",
    thumbnailUrl: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=1400&q=80",
    views: 1390,
  },
  {
    categorySlug: "meo-tiet-kiem",
    title: "Tip tiet kiem dien mua he cho nha pho",
    excerpt: "Dieu chinh nhiet do dieu hoa va cach su dung quat hop ly de giam hoa don.",
    content:
      "Dat dieu hoa 26 27 do, ket hop quat doi luu khong khi va ve sinh loc dinh ky. Dong rem vao gio nang gat va tranh bat tat dieu hoa lien tuc. Cac meo nho nay co the giup giam dang ke chi phi dien hang thang.",
    thumbnailUrl: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1400&q=80",
    views: 1756,
  },
  {
    categorySlug: "meo-gia-dinh",
    title: "Checklist don dep cuoi tuan gon gon trong 45 phut",
    excerpt: "Lam theo thu tu uu tien se giam cam giac qua tai viec nha.",
    content:
      "Chia theo 3 cum: be mat thuong dung, san nha va nha tam. Dat dong ho 15 phut moi cum, tranh sa da vao mot khu vuc qua lau. Ket thuc bang viec bo rac va mo cua thong gio de nha thoang hon.",
    thumbnailUrl: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=1400&q=80",
    views: 1120,
  },
  {
    categorySlug: "du-lich",
    title: "Nhip song Ha Noi cuoi tuan: 6 dia diem di bo dep va yen",
    excerpt: "Goi y nhung noi vua co cay xanh vua de di chuyen cho ca gia dinh.",
    content:
      "Tu ho Tay den khu pho co, ban co the chon cung duong di bo phu hop moi muc nang luong. Uu tien khung gio sang som hoac chieu muon de tranh dong duc. Di bo deu dan 30 phut moi ngay giup nang cao suc khoe tim mach va giam stress.",
    thumbnailUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
    isTrending: true,
    views: 2210,
  },
  {
    categorySlug: "meo-tiet-kiem",
    title: "Tai chinh ca nhan cho nguoi moi di lam: quy tac 50 30 20",
    excerpt: "Mot khung ngan sach de nho, de lam va de duy tri trong dai han.",
    content:
      "Phan bo thu nhap: 50 cho nhu cau, 30 cho mong muon va 20 cho tiet kiem dau tu. Bat dau bang so tien nho nhung deu, dong thoi lap quy du phong 3 6 thang chi phi. Ghi chep chi tieu theo tuan giup ban nhin ro hanh vi mua sam.",
    thumbnailUrl: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1400&q=80",
    views: 1888,
  },
  {
    categorySlug: "hot-tren-mang",
    title: "Xu huong song cham cua gioi tre do thi nam 2026",
    excerpt: "Song cham khong phai song cham tien do, ma la song co chu dich hon.",
    content:
      "Ngay cang nhieu ban tre uu tien suc khoe tinh than, thoi gian cho gia dinh va nhung trai nghiem that. Cac hoat dong nhu doc sach, lam gom, yoga va trekking nhe dang duoc quan tam. Song cham giup can bang giua ap luc cong viec va chat luong cuoc song.",
    thumbnailUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80",
    views: 1540,
  },
  {
    categorySlug: "nuoi-day-con",
    title: "Bi quyet giu nha cua gon gang khi co tre nho",
    excerpt: "Uu tien he thong don gian va phu hop nhiep sinh hoat cua ca nha.",
    content:
      "Dung hop dan nhan theo mau cho do choi, sach va do dung hoc tap. Dat quy tac 10 phut truoc gio ngu de ca nha cung thu gon. Muc tieu khong phai nha luon hoan hao, ma la de moi nguoi deu tham gia va duy tri ne nep.",
    thumbnailUrl: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1400&q=80",
    views: 1333,
  },
  {
    categorySlug: "tam-su",
    title: "4 ky thuat tho nhanh giam stress truoc hop quan trong",
    excerpt: "Tho dung cach trong 90 giay co the ha muc kich hoat cua co the.",
    content:
      "Ban co the ap dung ky thuat box breathing 4 4 4 4 hoac tho dai hon khi tho ra 4 6. Ket hop tha long vai va thu gian ham giup tim dap deu tro lai. Ky nang nay hieu qua trong cac tinh huong can giu binh tinh nhanh.",
    thumbnailUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1400&q=80",
    isTrending: true,
    views: 2699,
  },
  {
    categorySlug: "khoe-dep",
    title: "Playlist am nhac thu gian cho ngay lam viec cang",
    excerpt: "Nhac khong loi tiet tau cham giup de tap trung va on dinh cam xuc.",
    content:
      "Hay chon cac ban nhac lo-fi, piano va ambient voi am luong vua phai. Moi 45 phut, dung 2 phut de nghe va tho deu. Nhung khoang nghi nho nay giup bo nao khoi phuc va giam cam giac bi dan nen boi cong viec.",
    thumbnailUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1400&q=80",
    views: 1402,
  },
  {
    categorySlug: "hot-tren-mang",
    title: "Mini game 3 phut giup reset nao bo tai van phong",
    excerpt: "Mot chut vui nho giup doi nhom ket noi va giam cang thang.",
    content:
      "Thu mini game doan y qua emoji, tim diem khac nhau hoac cau hoi nhanh ve kien thuc doi song. Gioi han 3 phut de khong anh huong cong viec. Khong khi tich cuc trong nhom se giup hieu suat chung cai thien ro.",
    thumbnailUrl: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80",
    views: 1185,
  },
  {
    categorySlug: "chuyen-hay",
    title: "Goc vui cuoi ngay: 10 cau noi truyen cam hung ngan",
    excerpt: "Nhung cau noi ngan gon de ban ket thuc ngay voi tam the tich cuc.",
    content:
      "Sau mot ngay dai, nhung thong diep nho dung luc co the giup ban lay lai dong luc. Hay luu lai 10 cau noi yeu thich va doc lai moi toi. Viec nhac nho ban than deu dan la cach don gian de boi duong suc manh tinh than.",
    thumbnailUrl: "https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1400&q=80",
    views: 980,
  },
  {
    categorySlug: "tu-vi",
    title: "Tu vi 12 con giap tuan nay: ai co loc cong viec",
    excerpt: "Tong hop xu huong van trinh de ban tham khao va len ke hoach hop ly.",
    content:
      "Tuan nay, mot so tuoi co co hoi mo rong quan he cong viec va nhan duoc de xuat moi. Tuy nhien, nen than trong khi ra quyet dinh tai chinh lon. Tu vi chi mang tinh tham khao, dieu quan trong la su chu dong cua moi nguoi.",
    thumbnailUrl: "https://images.unsplash.com/photo-1524680159700-3b557d2b6d05?auto=format&fit=crop&w=1400&q=80",
    isTrending: true,
    views: 3320,
  },
  {
    categorySlug: "tuong-so",
    title: "Mau sac may man theo ngay cho 12 cung hoang dao",
    excerpt: "Goi y mau sac de phoi do va tao cam hung tich cuc trong ngay.",
    content:
      "Moi cung co the uu tien mot bang mau de tang cam giac tu tin trong cong viec va giao tiep. Ban co the ap dung qua phu kien nho nhu ca vat, tui xach hoac op dien thoai. Su hai hoa tong the van la yeu to quan trong nhat.",
    thumbnailUrl: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1400&q=80",
    views: 2105,
  },
  {
    categorySlug: "phong-thuy",
    title: "Ngay dep trong thang de khai truong va di chuyen",
    excerpt: "Lich tham khao cho cac ke hoach moi can su khoi dau thuan loi.",
    content:
      "Neu ban sap khai truong cua hang, chuyen van phong hoac bat dau du an moi, hay tham khao cac moc ngay dep trong thang. Ngoai yeu to tam linh, viec chuan bi ky luong ve nhan su, tai chinh va truyen thong van la then chot.",
    thumbnailUrl: "https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=1400&q=80",
    views: 1677,
  },
  {
    categorySlug: "video",
    title: "Video: 7 bai tap gian co vai gay cho dan van phong",
    excerpt: "Huong dan truc quan de ban tap cung dong nghiep ngay tai cho.",
    content:
      "Video huong dan 7 bai tap gian co vai gay, moi dong tac 30 giay. Ban co the thuc hien giua cac khung hop de giam moi co va nhuc dau. Chu y giu nhip tho deu va tranh dong tac qua suc.",
    thumbnailUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1400&q=80",
    videoEmbedUrl: "https://www.youtube.com/embed/2L2lnxIcNmo",
    isTrending: true,
    views: 2790,
  },
  {
    categorySlug: "video",
    title: "Video: Meal prep 3 bua toi trong 30 phut",
    excerpt: "Goi y nau an nhanh gon cho nguoi ban ron sau gio lam.",
    content:
      "Video tong hop 3 bua toi can bang voi nguyen lieu de mua. Moi mon duoc huong dan tung buoc, phu hop cho nguoi moi bat dau meal prep. Ban co the bien tau gia vi theo khau vi gia dinh.",
    thumbnailUrl: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1400&q=80",
    videoEmbedUrl: "https://www.youtube.com/embed/4aZr5hZXP_s",
    views: 1911,
  },
  {
    categorySlug: "video",
    title: "Video: Decor goc lam viec dep voi ngan sach 500k",
    excerpt: "Nang cap khong gian lam viec nho gon, sang va truyen cam hung hon.",
    content:
      "Huong dan cach sap xep anh sang, cay xanh va do dung co ban de toi uu goc lam viec. Muc tieu la tao khong gian gon gang, de tap trung va de duy tri thoi quen lam viec sau gio hanh chinh.",
    thumbnailUrl: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=80",
    videoEmbedUrl: "https://www.youtube.com/embed/lTRiuFIWV54",
    views: 1450,
  },
  {
    categorySlug: "video",
    title: "Video: Tu hoc thien 5 phut moi ngay cho nguoi moi",
    excerpt: "Bai tap ngan gon de ban bat dau hanh trinh cham soc tinh than.",
    content:
      "Video huong dan thien co ban trong 5 phut, phu hop cho nguoi moi. Ban co the ap dung vao dau ngay hoac truoc gio ngu de on dinh cam xuc. Kien tri nho moi ngay se tao thay doi ben vung.",
    thumbnailUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1400&q=80",
    videoEmbedUrl: "https://www.youtube.com/embed/inpok4MKVLM",
    views: 1688,
  },
]

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@songhay.vn"
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123456"

  const editorInChief = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Tổng biên tập Songhay",
      role: "EDITOR_IN_CHIEF",
      passwordHash: hashPassword(adminPassword),
    },
    create: {
      email: adminEmail,
      name: "Tổng biên tập Songhay",
      role: "EDITOR_IN_CHIEF",
      passwordHash: hashPassword(adminPassword),
    },
  })

  // ── Editorial accounts for RBAC matrix ─────────────────────────────────
  const editorPassword = "Editor@123456"

  const managingEditor = await prisma.user.upsert({
    where: { email: "managing.editor@songhay.vn" },
    update: { name: "Lê Thu Hà (Thư ký biên tập)", role: "MANAGING_EDITOR", passwordHash: hashPassword(editorPassword) },
    create: {
      email: "managing.editor@songhay.vn",
      name: "Lê Thu Hà (Thư ký biên tập)",
      role: "MANAGING_EDITOR",
      passwordHash: hashPassword(editorPassword),
    },
  })

  const teamLead = await prisma.user.upsert({
    where: { email: "team.lead@songhay.vn" },
    update: { name: "Phạm Duy Anh (Trưởng nhóm)", role: "TEAM_LEAD", passwordHash: hashPassword(editorPassword) },
    create: {
      email: "team.lead@songhay.vn",
      name: "Phạm Duy Anh (Trưởng nhóm)",
      role: "TEAM_LEAD",
      passwordHash: hashPassword(editorPassword),
    },
  })

  const editor1 = await prisma.user.upsert({
    where: { email: "editor1@songhay.vn" },
    update: { name: "Nguyễn Thị Lan (Phóng viên)", role: "REPORTER_TRANSLATOR", passwordHash: hashPassword(editorPassword) },
    create: {
      email: "editor1@songhay.vn",
      name: "Nguyễn Thị Lan (Phóng viên)",
      role: "REPORTER_TRANSLATOR",
      passwordHash: hashPassword(editorPassword),
    },
  })

  const editor2 = await prisma.user.upsert({
    where: { email: "editor2@songhay.vn" },
    update: { name: "Trần Minh Khoa (CTV)", role: "CONTRIBUTOR", passwordHash: hashPassword(editorPassword) },
    create: {
      email: "editor2@songhay.vn",
      name: "Trần Minh Khoa (CTV)",
      role: "CONTRIBUTOR",
      passwordHash: hashPassword(editorPassword),
    },
  })

  const penNameByNormalizedName = new Map<string, string>()
  async function ensureSeedPenName(inputName: string) {
    const name = toPenNameDisplayName(inputName)
    const normalizedName = normalizePenName(name)
    const cached = penNameByNormalizedName.get(normalizedName)

    if (cached) {
      return cached
    }

    const row = await prisma.penName.upsert({
      where: { normalizedName },
      update: { name },
      create: {
        name,
        normalizedName,
      },
      select: { id: true },
    })

    penNameByNormalizedName.set(normalizedName, row.id)
    return row.id
  }

  const categoryBySlug = new Map<string, string>()

  // Seed parent categories first
  for (const [index, category] of NAV_CATEGORIES.entries()) {
    const result = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, sortOrder: index + 1 },
      create: { slug: category.slug, name: category.name, sortOrder: index + 1 },
    })
    categoryBySlug.set(category.slug, result.id)
  }

  // Seed child categories with parentId
  for (const [index, category] of NAV_CATEGORIES.entries()) {
    if (!category.children || category.children.length === 0) continue
    const parentId = categoryBySlug.get(category.slug)
    if (!parentId) continue

    for (const [childIndex, child] of category.children.entries()) {
      const childResult = await prisma.category.upsert({
        where: { slug: child.slug },
        update: { name: child.name, parentId, sortOrder: (index + 1) * 100 + childIndex + 1 },
        create: { slug: child.slug, name: child.name, parentId, sortOrder: (index + 1) * 100 + childIndex + 1 },
      })
      categoryBySlug.set(child.slug, childResult.id)
    }
  }

  // ── Admin demo posts ─────────────────────────────────────────────────────
  for (const [index, post] of demoPosts.entries()) {
    const categoryId = categoryBySlug.get(post.categorySlug)

    if (!categoryId) {
      continue
    }

    const slug = slugify(post.title)
    const publishedAt = new Date(Date.now() - index * 8 * 60 * 60 * 1000)
    const penName = index % 2 === 0 ? "Phạm Anh" : "Thị Lan"
    const penNameId = await ensureSeedPenName(penName)

    const upserted = await prisma.post.upsert({
      where: { slug },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        thumbnailUrl: post.thumbnailUrl,
        videoEmbedUrl: post.videoEmbedUrl || null,
        seoTitle: `${post.title} | Songhay.vn`,
        seoDescription: post.excerpt,
        ogImage: post.thumbnailUrl,
        categoryId,
        penName,
        penNameId,
        isFeatured: Boolean(post.isFeatured),
        isTrending: Boolean(post.isTrending),
        isPublished: true,
        isDraft: false,
        editorialStatus: "PUBLISHED",
        authorId: index % 2 === 0 ? teamLead.id : editor1.id,
        approverId: editorInChief.id,
        lastEditorId: index % 3 === 0 ? managingEditor.id : index % 2 === 0 ? teamLead.id : undefined,
        views: post.views,
        publishedAt,
      },
      create: {
        slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        thumbnailUrl: post.thumbnailUrl,
        videoEmbedUrl: post.videoEmbedUrl || null,
        seoTitle: `${post.title} | Songhay.vn`,
        seoDescription: post.excerpt,
        ogImage: post.thumbnailUrl,
        categoryId,
        penName,
        penNameId,
        isFeatured: Boolean(post.isFeatured),
        isTrending: Boolean(post.isTrending),
        isPublished: true,
        isDraft: false,
        editorialStatus: "PUBLISHED",
        authorId: index % 2 === 0 ? teamLead.id : editor1.id,
        approverId: editorInChief.id,
        lastEditorId: index % 3 === 0 ? managingEditor.id : index % 2 === 0 ? teamLead.id : undefined,
        views: post.views,
        publishedAt,
      },
    })

    if (index < 6) {
      await prisma.comment.upsert({
        where: {
          id: `${upserted.id}-demo-comment`,
        },
        update: {
          authorName: "Ban doc Songhay",
          content: "Noi dung huu ich, cam on Songhay.vn da chia se!",
          isApproved: true,
        },
        create: {
          id: `${upserted.id}-demo-comment`,
          postId: upserted.id,
          authorName: "Ban doc Songhay",
          content: "Noi dung huu ich, cam on Songhay.vn da chia se!",
          isApproved: true,
        },
      })
    }
  }

  // ── Editor-authored posts (published — approved by admin) ────────────────
  const editorPublishedPosts = [
    {
      author: editor1,
      categorySlug: "khoe-dep",
      title: "BTV Lan: Cach giu dang dep sau sinh cho phu nu boi ban",
      excerpt: "Nhung bai tap nhe nhang va che do dinh duong phu hop cho mama sau sinh.",
      content:
        "Bai viet cua bien tap vien Nguyen Thi Lan, chia se kinh nghiem giu dang sau sinh. Tap trung vao cac bai tap core nhe, uong du nuoc va ngu du giac de phuc hoi nang luong.",
      thumbnailUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1400&q=80",
      views: 840,
    },
    {
      author: editor2,
      categorySlug: "meo-cong-nghe",
      title: "BTV Khoa: 7 ung dung productivity mien phi tot nhat 2026",
      excerpt: "Danh sach cac cong cu giup ban lam viec hieu qua hon ma khong ton mot dong.",
      content:
        "Bien tap vien khoa chia se 7 ung dung mien phi dang dung hang ngay: Notion, Obsidian, Toggl, Canva, Trello, Grammarly va Google Keep. Moi ung dung duoc giai thich ro use-case va cach cai dat.",
      thumbnailUrl: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1400&q=80",
      views: 1120,
    },
  ]

  for (const [index, post] of editorPublishedPosts.entries()) {
    const categoryId = categoryBySlug.get(post.categorySlug)
    if (!categoryId) continue

    const slug = slugify(post.title)
    const publishedAt = new Date(Date.now() - (index + 1) * 3 * 60 * 60 * 1000)
    const penName = post.author.name
    const penNameId = await ensureSeedPenName(penName)

    await prisma.post.upsert({
      where: { slug },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        thumbnailUrl: post.thumbnailUrl,
        categoryId,
        penName,
        penNameId,
        authorId: post.author.id,
        approverId: editorInChief.id,
        lastEditorId: managingEditor.id,
        approvedAt: publishedAt,
        isPublished: true,
        isDraft: false,
        editorialStatus: "PUBLISHED",
        views: post.views,
        publishedAt,
      },
      create: {
        slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        thumbnailUrl: post.thumbnailUrl,
        categoryId,
        penName,
        penNameId,
        authorId: post.author.id,
        approverId: editorInChief.id,
        lastEditorId: managingEditor.id,
        approvedAt: publishedAt,
        isPublished: true,
        isDraft: false,
        editorialStatus: "PUBLISHED",
        views: post.views,
        publishedAt,
      },
    })
  }

  // ── Editor-authored posts (pending review) ───────────────────────────────
  const editorPendingPosts = [
    {
      author: editor1,
      categorySlug: "nuoi-day-con",
      title: "BTV Lan [PENDING]: Xu huong nuoi thu cung healthy cho dan van phong 2026",
      excerpt: "Nuoi thu cung khong chi giam stress ma con giup chu nhan song lanh manh hon.",
      content:
        "Bai viet dang cho duyet. Bien tap vien Lan chia se nghien cuu ve moi lien he giua viec nuoi thu cung va suc khoe tinh than. Bao gom khao sat 500 nguoi va goi y 3 loai thu cung phu hop cho can ho nho.",
      thumbnailUrl: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1400&q=80",
    },
    {
      author: editor2,
      categorySlug: "tam-su",
      title: "BTV Khoa [PENDING]: Ky nang quan ly cam xuc khi bi sếp chi trich tren hop",
      excerpt: "Phan ung binh tinh va hieu qua truoc phe binh cong khai la ky nang co the hoc.",
      content:
        "Dang cho admin duyet. Bai viet de cap den cac ky nang EQ thuc te giup ban xu ly phe binh trong hop ma khong mat binh tinh: det lao, tra loi cau hoi, khong tu bien ho, va follow up rieng voi sep sau do.",
      thumbnailUrl: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80",
      status: "PENDING_PUBLISH" as const,
      lastEditorId: teamLead.id,
    },
    {
      author: editor2,
      categorySlug: "meo-tiet-kiem",
      title: "CTV Khoa [REJECTED]: 5 sai lam khi mua sam online dịp sale cuoi nam",
      excerpt: "Biet cach tranh bay se giup ban tiet kiem duoc khoan lon.",
      content:
        "Bai bi tu choi do chua du y. Ghi nhan loi khuyen cua admin de hoan thien them.",
      thumbnailUrl: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1400&q=80",
      status: "REJECTED" as const,
      lastEditorId: managingEditor.id,
    },
  ]

  for (const [index, post] of editorPendingPosts.entries()) {
    const categoryId = categoryBySlug.get(post.categorySlug)
    if (!categoryId) continue

    const slug = slugify(post.title)
    const penName = post.author.name
    const penNameId = await ensureSeedPenName(penName)

    await prisma.post.upsert({
      where: { slug },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        thumbnailUrl: post.thumbnailUrl,
        categoryId,
        penName,
        penNameId,
        authorId: post.author.id,
        lastEditorId: (post as any).lastEditorId || post.author.id,
        isPublished: false,
        isDraft: false,
        editorialStatus: (post as any).status || "PENDING_REVIEW",
      },
      create: {
        slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        thumbnailUrl: post.thumbnailUrl,
        categoryId,
        penName,
        penNameId,
        authorId: post.author.id,
        lastEditorId: (post as any).lastEditorId || post.author.id,
        isPublished: false,
        isDraft: false,
        editorialStatus: (post as any).status || "PENDING_REVIEW",
      },
    })

    // Add a pending comment for the second pending post to test comment moderation
    if (index === 1) {
      const pendingPost = await prisma.post.findUnique({ where: { slug }, select: { id: true } })
      if (pendingPost) {
        await prisma.comment.upsert({
          where: { id: `${pendingPost.id}-pending-comment` },
          update: { authorName: "Nguyen Van A", content: "Bai viet hay qua, mong som duoc xuat ban!", isApproved: false },
          create: {
            id: `${pendingPost.id}-pending-comment`,
            postId: pendingPost.id,
            authorName: "Nguyen Van A",
            content: "Bai viet hay qua, mong som duoc xuat ban!",
            isApproved: false,
          },
        })
      }
    }
  }

  // ── Editor draft (not submitted) ─────────────────────────────────────────
  const editor1DraftSlug = slugify("BTV Lan [DRAFT]: Bi kip chup anh do an dep tren dien thoai")
  const editor1DraftPenNameId = await ensureSeedPenName(editor1.name)
  await prisma.post.upsert({
    where: { slug: editor1DraftSlug },
    update: {
      title: "BTV Lan [DRAFT]: Bi kip chup anh do an dep tren dien thoai",
      excerpt: "Khong can may anh chuyen nghiep, chi can biet cach chup la du.",
      content: "Dang viet... Con thieu phan mo ta ky thuat anh sang tu nhien va goc chup dep.",
      thumbnailUrl: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1400&q=80",
      categoryId: categoryBySlug.get("meo-cong-nghe") || "",
      penName: editor1.name,
      penNameId: editor1DraftPenNameId,
      authorId: editor1.id,
      lastEditorId: editor1.id,
      isPublished: false,
      isDraft: true,
      editorialStatus: "DRAFT",
    },
    create: {
      slug: editor1DraftSlug,
      title: "BTV Lan [DRAFT]: Bi kip chup anh do an dep tren dien thoai",
      excerpt: "Khong can may anh chuyen nghiep, chi can biet cach chup la du.",
      content: "Dang viet... Con thieu phan mo ta ky thuat anh sang tu nhien va goc chup dep.",
      thumbnailUrl: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1400&q=80",
      categoryId: categoryBySlug.get("meo-cong-nghe") || "",
      penName: editor1.name,
      penNameId: editor1DraftPenNameId,
      authorId: editor1.id,
      lastEditorId: editor1.id,
      isPublished: false,
      isDraft: true,
      editorialStatus: "DRAFT",
    },
  })
  // ── Role permissions (seed from DEFAULT_PERMISSIONS) ─────────────────────
  // Seeds every role×action pair that is currently in DEFAULT_PERMISSIONS.
  // Roles not in ALL_EDITABLE_ROLES (ADMIN, USER) are deliberately skipped
  // since they are not customisable via the admin UI.
  console.log("  Seeding role permissions…")
  const permUpserts: Array<Promise<unknown>> = []
  for (const role of ALL_EDITABLE_ROLES) {
    const actions = DEFAULT_PERMISSIONS[role]
    // Remove any stale rows for this role that are no longer valid actions
    for (const action of ALL_PERMISSION_ACTIONS) {
      if (actions.has(action)) {
        permUpserts.push(
          prisma.rolePermission.upsert({
            where: { role_action: { role, action } },
            update: {},
            create: { role, action },
          })
        )
      }
    }
  }
  // Delete rows for actions that no longer exist in the defaults
  await prisma.rolePermission.deleteMany({
    where: {
      role: { in: ALL_EDITABLE_ROLES },
      action: { notIn: ALL_PERMISSION_ACTIONS },
    },
  })
  await Promise.all(permUpserts)
  console.log("  ✓ Role permissions seeded")
}



main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
