import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"



export async function GET() {
  const redirects = await prisma.redirect.findMany({
    where: { isActive: true },
    select: { fromPath: true, toPath: true },
  })
  return NextResponse.json(redirects)
}
