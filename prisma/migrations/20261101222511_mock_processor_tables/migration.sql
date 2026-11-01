-- CreateTable
CREATE TABLE "MockCheckout" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "amountAgorot" INTEGER NOT NULL,
    "installments" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "returnUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "authorizationId" TEXT,
    "cardLast4" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MockCheckout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockAuthorization" (
    "id" TEXT NOT NULL,
    "amountAgorot" INTEGER NOT NULL,
    "state" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MockAuthorization_pkey" PRIMARY KEY ("id")
);
