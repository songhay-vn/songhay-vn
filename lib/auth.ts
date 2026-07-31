import type { UserRole } from "@prisma/client"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"
import {
  canCreateSubordinateAccount,
  isElevatedCmsRole,
  hydratePermissionsFromDb,
  ALL_EDITABLE_ROLES,
} from "@/lib/permissions"
import { decodeSession, encodeSession, sessionTtlSeconds } from "@/lib/session"

const SESSION_COOKIE_NAME = "songhay_session"
export { decodeSession, encodeSession } from "@/lib/session"

export async function setSessionCookie(userId: string, role: UserRole) {
  const token = encodeSession({ userId, role })
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionTtlSeconds,
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function getCurrentSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  return decodeSession(token)
}

export async function getCurrentUser() {
  const session = await getCurrentSession()

  if (!session) {
    return null
  }

  const [user, rolePermissions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, email: true, role: true },
    }),
    prisma.rolePermission.findMany({
      where: { role: { in: ALL_EDITABLE_ROLES } },
      select: { role: true, action: true },
    }),
  ])

  if (!user) {
    return null
  }

  // Hydrate permissions from DB for the current request
  hydratePermissionsFromDb(rolePermissions)

  return user
}

async function requireUser(check?: (role: UserRole) => boolean) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login?admin=1")
  }

  if (check && !check(user.role)) {
    redirect("/")
  }

  return user
}

export async function requireAdminUser() {
  return requireUser((role) => isElevatedCmsRole(role))
}

export async function requireEditorInChiefUser() {
  return requireUser((role) => canCreateSubordinateAccount(role))
}

export async function requireCmsUser() {
  return requireUser()
}

export const authCookieName = SESSION_COOKIE_NAME
