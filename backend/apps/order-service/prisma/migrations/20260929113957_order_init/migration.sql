-- CreateEnum
CREATE TYPE "CheckoutStatus" AS ENUM ('PROCESSING', 'ORDER_WRITTEN', 'COMPENSATION_PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "CleanupStatus" AS ENUM ('PENDING', 'DONE', 'SKIPPED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_CONFIRMATION', 'PLACED', 'CANCELLATION_PENDING', 'SHIPPING', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('COD');

-- CreateEnum
CREATE TYPE "WarrantyStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED');

-- CreateTable
CREATE TABLE "CheckoutRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "bodyHash" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "cartVersion" INTEGER NOT NULL,
    "cartSnapshot" JSONB NOT NULL,
    "productSnapshot" JSONB NOT NULL,
    "addressSnapshot" JSONB NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'COD',
    "subtotal" INTEGER NOT NULL,
    "shippingFee" INTEGER NOT NULL DEFAULT 0,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "reservationKey" TEXT NOT NULL,
    "reservationExpiresAt" TIMESTAMP(3) NOT NULL,
    "reservationId" TEXT,
    "status" "CheckoutStatus" NOT NULL DEFAULT 'PROCESSING',
    "cleanupStatus" "CleanupStatus" NOT NULL DEFAULT 'PENDING',
    "failureCode" TEXT,
    "lastErrorCode" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "needsAttention" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckoutRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "checkoutRequestId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'COD',
    "subtotal" INTEGER NOT NULL,
    "shippingFee" INTEGER NOT NULL DEFAULT 0,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "placedAt" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationAttempts" INTEGER NOT NULL DEFAULT 0,
    "cancellationRetryAt" TIMESTAMP(3),
    "cancellationErrorCode" TEXT,
    "cancellationNeedsAttention" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "image" TEXT,
    "unitPrice" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "lineTotal" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderAddress" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "ward" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "OrderAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderStatusHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fromStatus" "OrderStatus",
    "toStatus" "OrderStatus" NOT NULL,
    "actorId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarrantyRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "status" "WarrantyStatus" NOT NULL DEFAULT 'OPEN',
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarrantyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarrantyStatusHistory" (
    "id" TEXT NOT NULL,
    "warrantyId" TEXT NOT NULL,
    "fromStatus" "WarrantyStatus",
    "toStatus" "WarrantyStatus" NOT NULL,
    "actorId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarrantyStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowLease" (
    "key" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowLease_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "CheckoutRequest_reservationKey_key" ON "CheckoutRequest"("reservationKey");

-- CreateIndex
CREATE UNIQUE INDEX "CheckoutRequest_reservationId_key" ON "CheckoutRequest"("reservationId");

-- CreateIndex
CREATE INDEX "CheckoutRequest_status_nextAttemptAt_idx" ON "CheckoutRequest"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "CheckoutRequest_cleanupStatus_nextAttemptAt_idx" ON "CheckoutRequest"("cleanupStatus", "nextAttemptAt");

-- CreateIndex
CREATE UNIQUE INDEX "CheckoutRequest_userId_key_key" ON "CheckoutRequest"("userId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Order_checkoutRequestId_key" ON "Order"("checkoutRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_reservationId_key" ON "Order"("reservationId");

-- CreateIndex
CREATE INDEX "Order_userId_createdAt_id_idx" ON "Order"("userId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Order_status_cancellationRetryAt_idx" ON "Order"("status", "cancellationRetryAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_orderId_productId_key" ON "OrderItem"("orderId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderAddress_orderId_key" ON "OrderAddress"("orderId");

-- CreateIndex
CREATE INDEX "OrderStatusHistory_orderId_createdAt_idx" ON "OrderStatusHistory"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "WarrantyRequest_userId_createdAt_id_idx" ON "WarrantyRequest"("userId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "WarrantyStatusHistory_warrantyId_createdAt_idx" ON "WarrantyStatusHistory"("warrantyId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkflowLease_expiresAt_idx" ON "WorkflowLease"("expiresAt");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_checkoutRequestId_fkey" FOREIGN KEY ("checkoutRequestId") REFERENCES "CheckoutRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderAddress" ADD CONSTRAINT "OrderAddress_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyRequest" ADD CONSTRAINT "WarrantyRequest_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyStatusHistory" ADD CONSTRAINT "WarrantyStatusHistory_warrantyId_fkey" FOREIGN KEY ("warrantyId") REFERENCES "WarrantyRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
