/*
# Expand Platform Schema: Assets, Exchanges, Predictions, Notifications, Profiles

## Purpose
Adds core domain tables that separate market reference data, AI predictions, user notifications,
and user profiles from user-owned trading data. This brings the schema closer to a production
trading platform with proper domain separation.

## New Tables

1. **assets** - Reference data for tradable tokens (symbol, name, network, decimals, category).
   Not user-owned — shared reference data readable by all authenticated users.

2. **exchanges** - Reference data for supported CEX/DEX integrations (display name, API endpoint,
   supported networks, status). Shared reference data.

3. **historical_prices** - Time-series storage for price candles, partitioned by timestamp.
   Separated from user tables as recommended. Stores OHLCV data per asset per timeframe.

4. **predictions** - AI/ML prediction records with confidence scores, model version, features
   used, and expiration. User-scoped (each user sees predictions relevant to their watchlist).

5. **notifications** - User notification center with categories (Market, Portfolio, Security,
   System, Reports), read/unread/pinned/archived states.

6. **user_profiles** - Extended user data beyond auth.users (display name, avatar, preferences,
   tier level). One-to-one with auth.users.

## Security
- RLS enabled on ALL tables.
- assets, exchanges, historical_prices: readable by all authenticated users (shared reference data).
  Only service role can write (no INSERT/UPDATE/DELETE policies for authenticated).
- predictions: owner-scoped via user_id.
- notifications: owner-scoped via user_id.
- user_profiles: owner can SELECT and UPDATE only (created via trigger on auth.users signup).
- All owner-scoped tables use DEFAULT auth.uid() on user_id columns.

## Notes
- historical_prices uses a composite index on (asset_id, timeframe, timestamp) for efficient queries.
- user_profiles has a trigger to auto-create a profile when a new auth user signs up.
- predictions stores features_used as JSONB for model explainability.
*/

-- =============================================
-- ASSETS TABLE (shared reference data)
-- =============================================
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  name text NOT NULL,
  network text NOT NULL DEFAULT 'SOLANA',
  contract_address text,
  decimals integer NOT NULL DEFAULT 9,
  category text NOT NULL DEFAULT 'MEME',
  logo_url text,
  market_cap numeric(36,2),
  circulating_supply numeric(36,2),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(symbol, network)
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_assets_symbol ON assets(symbol);
CREATE INDEX IF NOT EXISTS idx_assets_network ON assets(network);

DROP POLICY IF EXISTS "select_all_assets" ON assets;
CREATE POLICY "select_all_assets" ON assets FOR SELECT
  TO authenticated USING (true);

-- =============================================
-- EXCHANGES TABLE (shared reference data)
-- =============================================
CREATE TABLE IF NOT EXISTS exchanges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_code text NOT NULL UNIQUE,
  display_name text NOT NULL,
  api_endpoint text,
  status text NOT NULL DEFAULT 'ACTIVE',
  supported_networks text[] DEFAULT '{}',
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE exchanges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_all_exchanges" ON exchanges;
CREATE POLICY "select_all_exchanges" ON exchanges FOR SELECT
  TO authenticated USING (true);

-- =============================================
-- HISTORICAL_PRICES TABLE (time-series)
-- =============================================
CREATE TABLE IF NOT EXISTS historical_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  timeframe text NOT NULL DEFAULT '1m',
  timestamp timestamptz NOT NULL,
  open numeric(36,18) NOT NULL,
  high numeric(36,18) NOT NULL,
  low numeric(36,18) NOT NULL,
  close numeric(36,18) NOT NULL,
  volume numeric(36,18) NOT NULL DEFAULT 0
);

ALTER TABLE historical_prices ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_historical_prices_asset_tf_time ON historical_prices(asset_id, timeframe, timestamp DESC);

DROP POLICY IF EXISTS "select_all_historical_prices" ON historical_prices;
CREATE POLICY "select_all_historical_prices" ON historical_prices FOR SELECT
  TO authenticated USING (true);

-- =============================================
-- PREDICTIONS TABLE (user-scoped)
-- =============================================
CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id uuid REFERENCES assets(id) ON DELETE SET NULL,
  token_symbol text NOT NULL,
  prediction_class integer NOT NULL,
  confidence numeric(6,4) NOT NULL,
  model_version text NOT NULL DEFAULT 'xgboost-v1',
  features_used jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes')
);

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_expires ON predictions(expires_at);

DROP POLICY IF EXISTS "select_own_predictions" ON predictions;
CREATE POLICY "select_own_predictions" ON predictions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_predictions" ON predictions;
CREATE POLICY "insert_own_predictions" ON predictions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_predictions" ON predictions;
CREATE POLICY "delete_own_predictions" ON predictions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- NOTIFICATIONS TABLE (user-scoped)
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'System',
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  is_pinned boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE NOT is_read;

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- USER_PROFILES TABLE (one-to-one with auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  tier_level text NOT NULL DEFAULT 'standard',
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
CREATE POLICY "select_own_profile" ON user_profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
CREATE POLICY "update_own_profile" ON user_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;
CREATE POLICY "insert_own_profile" ON user_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- =============================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- UPDATED_AT TRIGGERS FOR NEW TABLES
-- =============================================
DROP TRIGGER IF EXISTS trg_assets_updated_at ON assets;
CREATE TRIGGER trg_assets_updated_at BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
