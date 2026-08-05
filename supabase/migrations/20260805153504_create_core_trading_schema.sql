/*
# Create Core Trading Platform Schema

## Purpose
Establishes the foundational database tables for the Zaphonx trading platform, supporting
user strategies, watchlists, positions, alerts, and audit logging.

## New Tables

1. **strategies** - Stores user-configured bot strategies with execution parameters as JSONB.
   Each strategy belongs to a user and tracks whether the bot is currently enabled.

2. **watchlists** - User-created watchlists for tracking tokens of interest.
   Each watchlist has a name and belongs to a user.

3. **watchlist_items** - Individual tokens within a watchlist, storing token address, network,
   and metadata. Child of watchlists with cascade delete.

4. **positions** - Records of trading positions (paper or live) with entry price, current price,
   size, PnL, stop-loss, trailing stop, and status tracking.

5. **alerts** - User-configured price or signal alerts for specific tokens.

6. **audit_logs** - Immutable audit trail of user actions for security and compliance.

## Security
- RLS enabled on ALL tables.
- All tables are owner-scoped: users can only access their own data via auth.uid() checks.
- Owner columns default to auth.uid() so inserts that omit user_id still work.
- 4 separate policies per table (SELECT, INSERT, UPDATE, DELETE).
- audit_logs is insert-only for users (no update/delete) to preserve immutability.

## Notes
- All tables use UUID primary keys with gen_random_uuid().
- Timestamps are timestamptz with sensible defaults.
- Foreign keys use ON DELETE CASCADE for child tables.
- Indexes created on user_id and foreign key columns for query performance.
*/

-- =============================================
-- STRATEGIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_name text NOT NULL,
  network_target text NOT NULL DEFAULT 'SOLANA',
  asset_targets text[] DEFAULT '{}',
  execution_parameters jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_strategies_user_id ON strategies(user_id);

DROP POLICY IF EXISTS "select_own_strategies" ON strategies;
CREATE POLICY "select_own_strategies" ON strategies FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_strategies" ON strategies;
CREATE POLICY "insert_own_strategies" ON strategies FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_strategies" ON strategies;
CREATE POLICY "update_own_strategies" ON strategies FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_strategies" ON strategies;
CREATE POLICY "delete_own_strategies" ON strategies FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- WATCHLISTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS watchlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON watchlists(user_id);

DROP POLICY IF EXISTS "select_own_watchlists" ON watchlists;
CREATE POLICY "select_own_watchlists" ON watchlists FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_watchlists" ON watchlists;
CREATE POLICY "insert_own_watchlists" ON watchlists FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_watchlists" ON watchlists;
CREATE POLICY "update_own_watchlists" ON watchlists FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_watchlists" ON watchlists;
CREATE POLICY "delete_own_watchlists" ON watchlists FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- WATCHLIST ITEMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS watchlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id uuid NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
  token_symbol text NOT NULL,
  token_address text NOT NULL,
  network text NOT NULL DEFAULT 'SOLANA',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_watchlist_items_watchlist_id ON watchlist_items(watchlist_id);

DROP POLICY IF EXISTS "select_own_watchlist_items" ON watchlist_items;
CREATE POLICY "select_own_watchlist_items" ON watchlist_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM watchlists WHERE watchlists.id = watchlist_items.watchlist_id AND watchlists.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_watchlist_items" ON watchlist_items;
CREATE POLICY "insert_own_watchlist_items" ON watchlist_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM watchlists WHERE watchlists.id = watchlist_items.watchlist_id AND watchlists.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_watchlist_items" ON watchlist_items;
CREATE POLICY "update_own_watchlist_items" ON watchlist_items FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM watchlists WHERE watchlists.id = watchlist_items.watchlist_id AND watchlists.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM watchlists WHERE watchlists.id = watchlist_items.watchlist_id AND watchlists.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_watchlist_items" ON watchlist_items;
CREATE POLICY "delete_own_watchlist_items" ON watchlist_items FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM watchlists WHERE watchlists.id = watchlist_items.watchlist_id AND watchlists.user_id = auth.uid())
  );

-- =============================================
-- POSITIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  token_symbol text NOT NULL,
  token_address text,
  network text NOT NULL DEFAULT 'SOLANA',
  position_type text NOT NULL DEFAULT 'PAPER',
  entry_price numeric(36,18) NOT NULL,
  current_price numeric(36,18) NOT NULL,
  size numeric(36,18) NOT NULL,
  pnl_pct numeric(10,4) NOT NULL DEFAULT 0,
  pnl_usd numeric(18,2) NOT NULL DEFAULT 0,
  highest_price numeric(36,18) NOT NULL,
  stop_loss numeric(36,18) NOT NULL,
  age_minutes numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'OPEN',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_positions_user_id ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);

DROP POLICY IF EXISTS "select_own_positions" ON positions;
CREATE POLICY "select_own_positions" ON positions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_positions" ON positions;
CREATE POLICY "insert_own_positions" ON positions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_positions" ON positions;
CREATE POLICY "update_own_positions" ON positions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_positions" ON positions;
CREATE POLICY "delete_own_positions" ON positions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- ALERTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  token_symbol text NOT NULL,
  token_address text,
  network text NOT NULL DEFAULT 'SOLANA',
  alert_type text NOT NULL DEFAULT 'PRICE',
  condition jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  triggered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(is_active);

DROP POLICY IF EXISTS "select_own_alerts" ON alerts;
CREATE POLICY "select_own_alerts" ON alerts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_alerts" ON alerts;
CREATE POLICY "insert_own_alerts" ON alerts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_alerts" ON alerts;
CREATE POLICY "update_own_alerts" ON alerts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_alerts" ON alerts;
CREATE POLICY "delete_own_alerts" ON alerts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- AUDIT LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Audit logs: users can INSERT and SELECT, but NOT UPDATE or DELETE (immutable trail)
DROP POLICY IF EXISTS "select_own_audit_logs" ON audit_logs;
CREATE POLICY "select_own_audit_logs" ON audit_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_audit_logs" ON audit_logs;
CREATE POLICY "insert_own_audit_logs" ON audit_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- =============================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_strategies_updated_at ON strategies;
CREATE TRIGGER trg_strategies_updated_at BEFORE UPDATE ON strategies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_watchlists_updated_at ON watchlists;
CREATE TRIGGER trg_watchlists_updated_at BEFORE UPDATE ON watchlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_positions_updated_at ON positions;
CREATE TRIGGER trg_positions_updated_at BEFORE UPDATE ON positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
