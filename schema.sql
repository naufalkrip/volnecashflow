-- ============================================================
-- Business Operations System — Supabase Schema
-- Aman di-run ulang: CREATE TABLE IF NOT EXISTS + IF NOT EXISTS
-- ============================================================

-- 1. TABLE: User
CREATE TABLE IF NOT EXISTS "User" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'USER',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TABLE: AffiliateMember
CREATE TABLE IF NOT EXISTS "AffiliateMember" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  username TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABLE: FinanceRecord
CREATE TABLE IF NOT EXISTS "FinanceRecord" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'INCOME',
  amount DOUBLE PRECISION NOT NULL,
  deduction DOUBLE PRECISION NOT NULL DEFAULT 0,
  "netAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "memberId" UUID NOT NULL REFERENCES "AffiliateMember"(id) ON DELETE CASCADE
);

-- 4. TABLE: Settings
CREATE TABLE IF NOT EXISTS "Settings" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "deductionPercentage" DOUBLE PRECISION NOT NULL DEFAULT 30.0,
  language TEXT NOT NULL DEFAULT 'en',
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES (opsional — untuk performa query)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_financerecord_date ON "FinanceRecord"(date);
CREATE INDEX IF NOT EXISTS idx_financerecord_memberid ON "FinanceRecord"("memberId");
CREATE INDEX IF NOT EXISTS idx_financerecord_type ON "FinanceRecord"(type);
CREATE INDEX IF NOT EXISTS idx_user_username ON "User"(username);
CREATE INDEX IF NOT EXISTS idx_affiliatemember_name ON "AffiliateMember"(name);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY (RLS) untuk semua tabel
-- ============================================================
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AffiliateMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FinanceRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Settings" ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES — allow all for service_role (backend)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'User' AND policyname = 'Allow all for service role') THEN
    CREATE POLICY "Allow all for service role" ON "User" USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'AffiliateMember' AND policyname = 'Allow all for service role') THEN
    CREATE POLICY "Allow all for service role" ON "AffiliateMember" USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'FinanceRecord' AND policyname = 'Allow all for service role') THEN
    CREATE POLICY "Allow all for service role" ON "FinanceRecord" USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Settings' AND policyname = 'Allow all for service role') THEN
    CREATE POLICY "Allow all for service role" ON "Settings" USING (true) WITH CHECK (true);
  END IF;
END $$;
