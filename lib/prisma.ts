import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Cap at 1 connection per process during build to prevent pool exhaustion when Next.js
// runs parallel build workers making concurrent cold DB calls. Capped at 5 in runtime.
function createPool() {
  const isBuild = process.env.NEXT_PHASE === "phase-production-build"
  return new Pool({
    connectionString: process.env.DATABASE_URL || "",
    max: isBuild ? 1 : 5,
  })
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(createPool()),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
