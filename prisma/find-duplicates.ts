import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import * as dotenv from "dotenv"

dotenv.config()

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL || "" }),
})

const posts = await prisma.post.findMany({
  where: { isDeleted: false },
  select: { id: true, title: true, slug: true, editorialStatus: true, isDraft: true, isPublished: true, createdAt: true },
  orderBy: { createdAt: "desc" }
})

const titles = new Map()
for (const p of posts) {
  const norm = p.title.toLowerCase().trim()
  if (!titles.has(norm)) titles.set(norm, [])
  titles.get(norm).push(p)
}

for (const [title, group] of titles.entries()) {
  if (group.length > 1) {
    console.log(`\nDUPLICATE TITLE: ${title}`)
    group.forEach((p: any) => console.log(`  - id:${p.id} | slug:${p.slug} | status:${p.editorialStatus} | isPublished:${p.isPublished}`))
  }
}

await prisma.$disconnect()
