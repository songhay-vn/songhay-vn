"use server"

import { revalidatePath, revalidateTag, updateTag } from "next/cache"
import { redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/slug"
import { requireActionPermission } from "@/app/admin/actions-helpers"
import {
  enqueueProductInspection,
  enqueueSitemapSubmit,
  scheduleSearchConsoleDrain,
} from "@/lib/search-console-queue"
import { getSearchConsoleSitemapUrl } from "@/lib/search-console"
import { deleteCloudinaryAsset, extractCloudinaryPublicId } from "@/lib/cloudinary"

async function uniqueProductSlug(name: string, excludeId?: string): Promise<string> {
  const baseSlug = slugify(name) || "san-pham"
  let slug = baseSlug
  let counter = 1

  while (true) {
    const existing = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!existing || existing.id === excludeId) {
      return slug
    }

    counter++
    slug = `${baseSlug}-${counter}`
  }
}

export async function createProduct(formData: FormData) {
  await requireActionPermission("manage-products", "/admin?tab=products&toast=post_action_forbidden")

  const name = String(formData.get("name") || "").trim()
  const imageUrl = String(formData.get("imageUrl") || "").trim()
  const imagePublicId = String(formData.get("imagePublicId") || "").trim() || null
  const description = String(formData.get("description") || "").trim() || null

  const rawGalleryUrls = String(formData.get("galleryUrls") || "").trim()
  let galleryUrls: string[] = []
  if (rawGalleryUrls) {
    try {
      galleryUrls = JSON.parse(rawGalleryUrls)
    } catch {
      galleryUrls = []
    }
  }

  if (!name || !imageUrl) {
    redirect("/admin?tab=products&toast=post_action_failed")
  }

  const slug = await uniqueProductSlug(name)

  const maxSortOrder = await prisma.product.aggregate({ _max: { sortOrder: true } })
  const nextSortOrder = (maxSortOrder._max.sortOrder || 0) + 1

  let product
  try {
    product = await prisma.product.create({
      data: {
        name,
        slug,
        imageUrl,
        imagePublicId,
        galleryUrls,
        description,
        sortOrder: nextSortOrder,
        isIndexed: true,
      },
    })
  } catch (err: unknown) {
    // Handle duplicate slug from concurrent creates
    const code = (err as { code?: string })?.code
    if (code === "P2002") {
      redirect("/admin?tab=products&toast=post_action_failed")
    }
    throw err
  }

  await enqueueProductInspection(product.slug, { force: true })
  scheduleSearchConsoleDrain()

  revalidatePath("/admin")
  revalidatePath("/san-pham")
  revalidatePath("/san-pham/[slug]", "page")
  revalidatePath("/")
  updateTag("products")
  revalidateTag("products", "max")

  redirect("/admin?tab=products&toast=product_created")
}

export async function updateProduct(formData: FormData) {
  await requireActionPermission("manage-products", "/admin?tab=products&toast=post_action_forbidden")

  const productId = String(formData.get("productId") || "").trim()
  const name = String(formData.get("name") || "").trim()
  const imageUrl = String(formData.get("imageUrl") || "").trim()
  const imagePublicId = String(formData.get("imagePublicId") || "").trim() || null
  const description = String(formData.get("description") || "").trim() || null
  const rawGalleryUrls = String(formData.get("galleryUrls") || "").trim()
  let galleryUrls: string[] = []
  if (rawGalleryUrls) {
    try {
      galleryUrls = JSON.parse(rawGalleryUrls)
    } catch {
      galleryUrls = []
    }
  }

  if (!productId || !name || !imageUrl) {
    redirect("/admin?tab=products&toast=post_action_failed")
  }

  const existing = await prisma.product.findUnique({
    where: { id: productId },
  })

  if (!existing) {
    redirect("/admin?tab=products&toast=post_not_found")
  }

  const slug = await uniqueProductSlug(name, productId)

  await prisma.product.update({
    where: { id: productId },
    data: {
      name,
      slug,
      imageUrl,
      imagePublicId,
      galleryUrls,
      description,
    },
  })

  // Delete old primary image if replaced
  if (existing.imageUrl !== imageUrl) {
    const oldPrimaryPublicId = existing.imagePublicId || extractCloudinaryPublicId(existing.imageUrl)
    if (oldPrimaryPublicId) {
      await deleteCloudinaryAsset(oldPrimaryPublicId)
    }
  }

  // Delete gallery images removed from product gallery upon save
  const removedGalleryUrls = existing.galleryUrls.filter((url) => !galleryUrls.includes(url))
  for (const removedUrl of removedGalleryUrls) {
    const publicId = extractCloudinaryPublicId(removedUrl)
    if (publicId) {
      await deleteCloudinaryAsset(publicId)
    }
  }

  if (existing.slug !== slug && existing.isIndexed) {
    await enqueueProductInspection(slug, { force: true })
    scheduleSearchConsoleDrain()
  }

  revalidatePath("/admin")
  revalidatePath("/san-pham")
  revalidatePath(`/san-pham/${slug}`)
  if (existing.slug !== slug) {
    revalidatePath(`/san-pham/${existing.slug}`)
  }
  revalidatePath("/")
  updateTag("products")
  revalidateTag("products", "max")

  redirect("/admin?tab=products&toast=product_updated")
}

export async function deleteProduct(formData: FormData) {
  await requireActionPermission("manage-products", "/admin?tab=products&toast=post_action_forbidden")

  const productId = String(formData.get("productId") || "").trim()
  if (!productId) {
    redirect("/admin?tab=products&toast=post_action_failed")
  }

  const existing = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, slug: true, imageUrl: true, imagePublicId: true, galleryUrls: true },
  })

  if (!existing) {
    redirect("/admin?tab=products&toast=post_not_found")
  }

  // Delete primary image from Cloudinary
  const primaryPublicId = existing.imagePublicId || extractCloudinaryPublicId(existing.imageUrl)
  if (primaryPublicId) {
    await deleteCloudinaryAsset(primaryPublicId)
  }

  // Delete gallery images from Cloudinary
  for (const galleryUrl of existing.galleryUrls) {
    const publicId = extractCloudinaryPublicId(galleryUrl)
    if (publicId) {
      await deleteCloudinaryAsset(publicId)
    }
  }

  await prisma.product.delete({
    where: { id: productId },
  })

  await enqueueSitemapSubmit(getSearchConsoleSitemapUrl())
  scheduleSearchConsoleDrain()

  revalidatePath("/admin")
  revalidatePath("/san-pham")
  revalidatePath(`/san-pham/${existing.slug}`)
  revalidatePath("/")
  updateTag("products")
  revalidateTag("products", "max")

  redirect("/admin?tab=products&toast=product_deleted")
}

export async function toggleProductIndex(formData: FormData) {
  await requireActionPermission("manage-products", "/admin?tab=products&toast=post_action_forbidden")

  const productId = String(formData.get("productId") || "").trim()
  if (!productId) {
    redirect("/admin?tab=products&toast=post_action_failed")
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, slug: true, isIndexed: true },
  })

  if (!product) {
    redirect("/admin?tab=products&toast=post_not_found")
  }

  const newIsIndexed = !product.isIndexed

  await prisma.product.update({
    where: { id: productId },
    data: { isIndexed: newIsIndexed },
  })

  if (newIsIndexed) {
    await enqueueProductInspection(product.slug, { force: true })
    scheduleSearchConsoleDrain()
  }

  revalidatePath("/admin")
  revalidatePath("/san-pham")
  revalidatePath(`/san-pham/${product.slug}`)
  revalidatePath("/")
  updateTag("products")
  revalidateTag("products", "max")

  redirect("/admin?tab=products&toast=product_updated")
}

export async function updateBulkSidebarSettings(formData: FormData) {
  await requireActionPermission("manage-products", "/admin?tab=products&toast=post_action_forbidden")
  
  const productIds = formData.getAll("productIds") as string[]
  if (!productIds.length) redirect("/admin?tab=products")

  await prisma.$transaction(
    productIds.map(id => {
      const showOnSidebar = formData.get(`visibility_${id}`) === "true"
      const sortOrderStr = formData.get(`order_${id}`) as string
      const sortOrder = parseInt(sortOrderStr, 10) || 0
      
      return prisma.product.update({
        where: { id },
        data: { showOnSidebar, sortOrder }
      })
    })
  )

  updateTag("products")
  revalidateTag("products", "max")
  redirect("/admin?tab=products&toast=product_updated")
}
