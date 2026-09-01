-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('SCIENCE_PRODUCT', 'VIET_GIFT');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "type" "ProductType" NOT NULL DEFAULT 'SCIENCE_PRODUCT',
ADD COLUMN     "zaloUrl" TEXT,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "zaloClickCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Product_type_isIndexed_idx" ON "Product"("type", "isIndexed");

-- CreateIndex
CREATE INDEX "Product_type_showOnSidebar_sortOrder_idx" ON "Product"("type", "showOnSidebar", "sortOrder");

-- CreateIndex
CREATE INDEX "Product_type_sortOrder_createdAt_idx" ON "Product"("type", "sortOrder", "createdAt" DESC);
