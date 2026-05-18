import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import * as dotenv from "dotenv"

dotenv.config()

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL || "" }),
})

const posts = await prisma.post.findMany({
  select: {
    id: true,
    title: true,
    slug: true,
    isDraft: true,
    isPublished: true,
    isDeleted: true,
    editorialStatus: true,
  },
  orderBy: { slug: "asc" },
})

for (const p of posts) {
  const match = p.slug.match(/^(.*)-(\d+)$/)
  if (!match) continue
  console.log(
    `slug=${p.slug} | status=${p.editorialStatus} | isDraft=${p.isDraft} | isPublished=${p.isPublished} | isDeleted=${p.isDeleted} | id=${p.id}`
  )
}

await prisma.$disconnect()
