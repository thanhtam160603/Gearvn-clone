-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'RELEASED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "brandId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "shortDescription" TEXT,
    "description" TEXT,
    "originalPrice" INTEGER,
    "salePrice" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in-stock',
    "warranty" TEXT,
    "promotion" TEXT,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "highlights" JSONB NOT NULL DEFAULT '[]',
    "variants" JSONB NOT NULL DEFAULT '[]',
    "bundles" JSONB NOT NULL DEFAULT '[]',
    "contentSections" JSONB NOT NULL DEFAULT '[]',
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSpec" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "groupTitle" TEXT NOT NULL,
    "groupPosition" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "ProductSpec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAttribute" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "normalizedValue" TEXT NOT NULL,

    CONSTRAINT "ProductAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "breadcrumbLabel" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "bannerSrc" TEXT,
    "bannerAlt" TEXT,
    "filterDefinitions" JSONB NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionProduct" (
    "collectionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "CollectionProduct_pkey" PRIMARY KEY ("collectionId","productId")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "productId" TEXT NOT NULL,
    "available" INTEGER NOT NULL,
    "reserved" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "StockReservation" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockReservationItem" (
    "reservationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "StockReservationItem_pkey" PRIMARY KEY ("reservationId","productId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Brand_normalizedName_key" ON "Brand"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_salePrice_id_idx" ON "Product"("salePrice", "id");

-- CreateIndex
CREATE INDEX "Product_sortOrder_id_idx" ON "Product"("sortOrder", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ProductImage_productId_position_key" ON "ProductImage"("productId", "position");

-- CreateIndex
CREATE INDEX "ProductSpec_productId_featured_groupPosition_position_idx" ON "ProductSpec"("productId", "featured", "groupPosition", "position");

-- CreateIndex
CREATE INDEX "ProductAttribute_key_normalizedValue_idx" ON "ProductAttribute"("key", "normalizedValue");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAttribute_productId_key_normalizedValue_key" ON "ProductAttribute"("productId", "key", "normalizedValue");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_slug_key" ON "Collection"("slug");

-- CreateIndex
CREATE INDEX "CollectionProduct_productId_idx" ON "CollectionProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "StockReservation_idempotencyKey_key" ON "StockReservation"("idempotencyKey");

-- CreateIndex
CREATE INDEX "StockReservation_status_expiresAt_idx" ON "StockReservation"("status", "expiresAt");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSpec" ADD CONSTRAINT "ProductSpec_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAttribute" ADD CONSTRAINT "ProductAttribute_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionProduct" ADD CONSTRAINT "CollectionProduct_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionProduct" ADD CONSTRAINT "CollectionProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReservationItem" ADD CONSTRAINT "StockReservationItem_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "StockReservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReservationItem" ADD CONSTRAINT "StockReservationItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Product"
  ADD CONSTRAINT "Product_salePrice_nonnegative" CHECK ("salePrice" >= 0),
  ADD CONSTRAINT "Product_originalPrice_nonnegative"
    CHECK ("originalPrice" IS NULL OR "originalPrice" >= 0);
ALTER TABLE "Inventory"
  ADD CONSTRAINT "Inventory_available_nonnegative" CHECK ("available" >= 0),
  ADD CONSTRAINT "Inventory_reserved_nonnegative" CHECK ("reserved" >= 0);
ALTER TABLE "StockReservationItem"
  ADD CONSTRAINT "ReservationItem_quantity_positive" CHECK ("quantity" > 0);