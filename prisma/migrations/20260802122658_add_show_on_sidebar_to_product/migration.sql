-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "showOnSidebar" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Product_showOnSidebar_sortOrder_idx" ON "Product"("showOnSidebar", "sortOrder");

