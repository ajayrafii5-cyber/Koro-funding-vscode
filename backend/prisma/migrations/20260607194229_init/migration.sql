-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('MT5', 'MT4', 'MATCHTRADER', 'CTRADER', 'DXTRADE');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CHALLENGE_2STEP', 'CHALLENGE_1STEP', 'INSTANT_FUNDING', 'FUNDED');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'PASSED', 'BREACHED', 'FUNDED', 'EXPIRED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'CRYPTO', 'BANK_TRANSFER', 'PAYPAL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PayoutMethod" AS ENUM ('BANK_TRANSFER', 'WISE', 'USDT_TRC20', 'USDT_ERC20', 'BTC', 'PAYPAL');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'PROCESSING', 'PAID', 'REJECTED');

-- CreateEnum
CREATE TYPE "BreachType" AS ENUM ('DAILY_LOSS', 'MAX_DRAWDOWN', 'CONSISTENCY_RULE', 'HFT_DETECTED', 'ARBITRAGE_DETECTED');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "KycDocType" AS ENUM ('GOVERNMENT_ID', 'PROOF_OF_ADDRESS', 'SELFIE_WITH_ID', 'BANK_STATEMENT', 'TAX_ID');

-- CreateEnum
CREATE TYPE "KycDocStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AffiliateTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'DIAMOND');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED');

-- CreateTable
CREATE TABLE "Trader" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "country" TEXT,
    "taxId" TEXT,
    "affiliateRefCode" TEXT,
    "referredBy" TEXT,
    "kycStatus" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "Trader_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradingAccount" (
    "id" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "platformLogin" TEXT NOT NULL,
    "platformPassword" TEXT NOT NULL,
    "platformServer" TEXT NOT NULL,
    "platform" "Platform" NOT NULL DEFAULT 'MT5',
    "type" "AccountType" NOT NULL,
    "size" INTEGER NOT NULL,
    "phase" INTEGER NOT NULL DEFAULT 1,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "equity" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "openPnl" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "dailyLossUsed" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "maxDrawdownUsed" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "profitToDate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tradingDays" INTEGER NOT NULL DEFAULT 0,
    "dailyLossLimit" DECIMAL(65,30) NOT NULL,
    "maxDrawdownLimit" DECIMAL(65,30) NOT NULL,
    "profitTarget" DECIMAL(65,30) NOT NULL,
    "payoutSplit" DECIMAL(65,30) NOT NULL DEFAULT 80,
    "orderId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "passedPhaseAt" TIMESTAMP(3),
    "fundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradingAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "challengeType" "AccountType" NOT NULL,
    "accountSize" INTEGER NOT NULL,
    "pricePaid" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentProvider" TEXT NOT NULL,
    "paymentReference" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "promoCode" TEXT,
    "discountAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amountGross" DECIMAL(65,30) NOT NULL,
    "splitPercentage" DECIMAL(65,30) NOT NULL,
    "amountNet" DECIMAL(65,30) NOT NULL,
    "fee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "method" "PayoutMethod" NOT NULL,
    "bankDetails" JSONB,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "approvedBy" TEXT,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "platformTicket" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "lots" DECIMAL(65,30) NOT NULL,
    "openPrice" DECIMAL(65,30) NOT NULL,
    "closePrice" DECIMAL(65,30),
    "openTime" TIMESTAMP(3) NOT NULL,
    "closeTime" TIMESTAMP(3),
    "profit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "swap" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "commission" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BreachEvent" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" "BreachType" NOT NULL,
    "valueAtBreach" DECIMAL(65,30) NOT NULL,
    "limitValue" DECIMAL(65,30) NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailSentAt" TIMESTAMP(3),

    CONSTRAINT "BreachEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricsSnapshot" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL,
    "equity" DECIMAL(65,30) NOT NULL,
    "dailyPnl" DECIMAL(65,30) NOT NULL,
    "openLots" DECIMAL(65,30) NOT NULL,
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetricsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycDocument" (
    "id" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "type" "KycDocType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "status" "KycDocStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewNote" TEXT,
    "sumsumApplicantId" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "KycDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateStats" (
    "id" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "tier" "AffiliateTier" NOT NULL DEFAULT 'BRONZE',
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "totalConversions" INTEGER NOT NULL DEFAULT 0,
    "totalEarned" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "pendingBalance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "paidBalance" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "AffiliateStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateConversion" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "commissionRate" DECIMAL(65,30) NOT NULL,
    "commissionAmount" DECIMAL(65,30) NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "convertedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "AffiliateConversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "orderId" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Trader_email_key" ON "Trader"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Trader_affiliateRefCode_key" ON "Trader"("affiliateRefCode");

-- CreateIndex
CREATE INDEX "Trader_email_idx" ON "Trader"("email");

-- CreateIndex
CREATE INDEX "Trader_affiliateRefCode_idx" ON "Trader"("affiliateRefCode");

-- CreateIndex
CREATE UNIQUE INDEX "TradingAccount_platformLogin_key" ON "TradingAccount"("platformLogin");

-- CreateIndex
CREATE INDEX "TradingAccount_traderId_idx" ON "TradingAccount"("traderId");

-- CreateIndex
CREATE INDEX "TradingAccount_status_idx" ON "TradingAccount"("status");

-- CreateIndex
CREATE INDEX "Order_traderId_idx" ON "Order"("traderId");

-- CreateIndex
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");

-- CreateIndex
CREATE INDEX "Payout_traderId_idx" ON "Payout"("traderId");

-- CreateIndex
CREATE INDEX "Payout_status_idx" ON "Payout"("status");

-- CreateIndex
CREATE INDEX "Trade_accountId_idx" ON "Trade"("accountId");

-- CreateIndex
CREATE INDEX "Trade_isOpen_idx" ON "Trade"("isOpen");

-- CreateIndex
CREATE UNIQUE INDEX "Trade_accountId_platformTicket_key" ON "Trade"("accountId", "platformTicket");

-- CreateIndex
CREATE INDEX "BreachEvent_accountId_idx" ON "BreachEvent"("accountId");

-- CreateIndex
CREATE INDEX "MetricsSnapshot_accountId_snapshotAt_idx" ON "MetricsSnapshot"("accountId", "snapshotAt");

-- CreateIndex
CREATE INDEX "KycDocument_traderId_idx" ON "KycDocument"("traderId");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateStats_traderId_key" ON "AffiliateStats"("traderId");

-- CreateIndex
CREATE INDEX "AffiliateConversion_referrerId_idx" ON "AffiliateConversion"("referrerId");

-- CreateIndex
CREATE INDEX "WebhookEvent_provider_eventType_idx" ON "WebhookEvent"("provider", "eventType");

-- CreateIndex
CREATE INDEX "WebhookEvent_processed_idx" ON "WebhookEvent"("processed");

-- AddForeignKey
ALTER TABLE "TradingAccount" ADD CONSTRAINT "TradingAccount_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "Trader"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradingAccount" ADD CONSTRAINT "TradingAccount_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "Trader"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "TradingAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "TradingAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreachEvent" ADD CONSTRAINT "BreachEvent_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "TradingAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricsSnapshot" ADD CONSTRAINT "MetricsSnapshot_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "TradingAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycDocument" ADD CONSTRAINT "KycDocument_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "Trader"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateStats" ADD CONSTRAINT "AffiliateStats_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "Trader"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEvent" ADD CONSTRAINT "WebhookEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
