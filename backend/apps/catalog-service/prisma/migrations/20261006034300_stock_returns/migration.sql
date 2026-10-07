CREATE TABLE "StockReturn" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockReturn_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StockReturn_orderId_key" ON "StockReturn"("orderId");
CREATE UNIQUE INDEX "StockReturn_reservationId_key" ON "StockReturn"("reservationId");

ALTER TABLE "StockReturn" ADD CONSTRAINT "StockReturn_reservationId_fkey"
    FOREIGN KEY ("reservationId") REFERENCES "StockReservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
