-- CreateTable
CREATE TABLE "UpsellRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "triggerProductId" TEXT NOT NULL,
    "triggerProductTitle" TEXT NOT NULL,
    "recommendedProductId" TEXT NOT NULL,
    "recommendedProductTitle" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "UpsellRule_shop_idx" ON "UpsellRule"("shop");

-- CreateIndex
CREATE INDEX "UpsellRule_shop_triggerProductId_idx" ON "UpsellRule"("shop", "triggerProductId");
