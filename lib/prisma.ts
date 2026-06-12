import { PrismaPg } from "@prisma/adapter-pg"
import { readFileSync } from "node:fs"
import type { ConnectionOptions } from "node:tls"
import { Pool } from "pg"

import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function parseRejectUnauthorized(value: string | undefined) {
  if (!value) {
    return undefined
  }

  return value.toLowerCase() !== "false"
}

function getDatabaseSslConfig(): ConnectionOptions | undefined {
  const rejectUnauthorized = parseRejectUnauthorized(
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED
  )
  const ca =
    process.env.DATABASE_SSL_CA_BASE64
      ? Buffer.from(process.env.DATABASE_SSL_CA_BASE64, "base64").toString(
          "utf8"
        )
      : process.env.DATABASE_SSL_CA_PATH
        ? readFileSync(process.env.DATABASE_SSL_CA_PATH, "utf8")
        : undefined

  if (ca || rejectUnauthorized !== undefined) {
    return {
      ...(ca ? { ca } : {}),
      ...(rejectUnauthorized !== undefined ? { rejectUnauthorized } : {}),
    }
  }

  return undefined
}

function buildPgConnectionString(
  connectionString: string,
  ssl: ConnectionOptions | undefined
) {
  if (!ssl) {
    return connectionString
  }

  let url: URL
  try {
    url = new URL(connectionString)
  } catch {
    return connectionString
  }

  for (const param of [
    "sslmode",
    "sslcert",
    "sslkey",
    "sslrootcert",
    "sslidentity",
    "sslpassword",
    "sslaccept",
  ]) {
    url.searchParams.delete(param)
  }

  return url.toString()
}

// Cap at 1 connection per process during build to prevent pool exhaustion when Next.js
// runs parallel build workers making concurrent cold DB calls. Capped at 5 in runtime.
function createPool() {
  const isBuild = process.env.NEXT_PHASE === "phase-production-build"
  const ssl = getDatabaseSslConfig()
  const connectionString = process.env.DATABASE_URL || ""

  return new Pool({
    connectionString: buildPgConnectionString(connectionString, ssl),
    ssl,
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
