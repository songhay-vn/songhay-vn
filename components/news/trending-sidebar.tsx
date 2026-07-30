import { cacheTag, cacheLife } from "next/cache"
import { ProductsSidebar } from "./products-sidebar"

export async function TrendingSidebar() {
  "use cache"
  cacheTag("products")
  cacheLife("hours")
  return <ProductsSidebar />
}
