-- AlterTable
ALTER TABLE "ProductSet" ADD COLUMN "hiddurLevel" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" INTEGER NOT NULL,
    "totalPrice" INTEGER NOT NULL,
    "depositAmount" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "neighborhood" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "notes" TEXT,
    "depositMarkedPaid" BOOLEAN NOT NULL DEFAULT false,
    "depositMarkedAt" DATETIME,
    "depositConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "depositConfirmedAt" DATETIME,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Order" ("address", "adminNotes", "createdAt", "customerName", "depositAmount", "depositConfirmed", "depositConfirmedAt", "depositMarkedAt", "depositMarkedPaid", "email", "id", "neighborhood", "notes", "orderNumber", "phone", "status", "termsAccepted", "totalPrice", "updatedAt") SELECT "address", "adminNotes", "createdAt", "customerName", "depositAmount", "depositConfirmed", "depositConfirmedAt", "depositMarkedAt", "depositMarkedPaid", "email", "id", "neighborhood", "notes", "orderNumber", "phone", "status", "termsAccepted", "totalPrice", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
