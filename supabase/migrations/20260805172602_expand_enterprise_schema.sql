/*
# Expand Enterprise Schema: Workspaces, Activity Logs, Feature Flags, Sessions, Login Attempts

## Purpose
Adds enterprise-grade tables for workspace management, structured activity
logging, feature flagging, session tracking, and login attempt auditing.
These tables support multi-tenant workspace layouts, security observability,
and progressive feature rollout.

## New Tables

1. **workspaces** — Named workspace configurations per user (layout presets,
   widget arrangements). User-scoped.

2. **workspace_widgets** — Individual widget definitions within a workspace
   (type, position, size, configuration). FK to workspaces.

3. **activity_logs** — Structured user activity events (action, entity,
   metadata, ip, user_agent). Replaces ad-hoc audit_logs for user-facing
   activity. User-scoped.

4. **feature_flags** — Feature flag definitions with enabled state, rollout
   percentage, and targeting rules. Shared reference data.

5. **user_feature_flags** — Per-user feature flag overrides. User-scoped.

6. **login_attempts** — Security audit trail for login attempts (email, ip,
   user_agent, success/failure, timestamp). Used for rate limiting and
   brute-force detection.

7. **user_sessions** — Active session tracking (session token hash, device
   info, ip, expires_at). User-scoped.

8. **notification_preferences** — Per-user notification channel preferences
   (email, push, in-app, per-category toggles). User-scoped.

9. **search_history** — User search history for the command palette / global
   search. User-scoped, auto-expiring.

10. **favorites** — User-favorited assets for quick access. User-scoped.

## Security
- RLS enabled on ALL tables.
- Shared reference data (feature_flags): readable by all authenticated.
- User-scoped tables: full CRUD scoped via auth.uid() = user_id.
- login_attempts: INSERT only (no SELECT for users — service role reviews).
- activity_logs: INSERT + SELECT own logs.
*/

-- =============================================
-- WORKSPACES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  layout_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);

DROP POLICY IF EXISTS "select_own_workspaces" ON workspaces;
CREATE POLICY "select_own_workspaces" ON workspaces FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_workspaces" ON workspaces;
CREATE POLICY "insert_own_workspaces" ON workspaces FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_workspaces" ON workspaces;
CREATE POLICY "update_own_workspaces" ON workspaces FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_workspaces" ON workspaces;
CREATE POLICY "delete_own_workspaces" ON workspaces FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- WORKSPACE_WIDGETS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS workspace_widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  widget_type text NOT NULL,
  title text NOT NULL,
  position_x integer NOT NULL DEFAULT 0,
  position_y integer NOT NULL DEFAULT 0,
  width integer NOT NULL DEFAULT 300,
  height integer NOT NULL DEFAULT 200,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE workspace_widgets ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_workspace_widgets_workspace_id ON workspace_widgets(workspace_id);

DROP POLICY IF EXISTS "select_own_workspace_widgets" ON workspace_widgets;
CREATE POLICY "select_own_workspace_widgets" ON workspace_widgets FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM workspaces w WHERE w.id = workspace_id AND w.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "insert_own_workspace_widgets" ON workspace_widgets;
CREATE POLICY "insert_own_workspace_widgets" ON workspace_widgets FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM workspaces w WHERE w.id = workspace_id AND w.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "update_own_workspace_widgets" ON workspace_widgets;
CREATE POLICY "update_own_workspace_widgets" ON workspace_widgets FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM workspaces w WHERE w.id = workspace_id AND w.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "delete_own_workspace_widgets" ON workspace_widgets;
CREATE POLICY "delete_own_workspace_widgets" ON workspace_widgets FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM workspaces w WHERE w.id = workspace_id AND w.user_id = auth.uid())
  );

-- =============================================
-- ACTIVITY_LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

DROP POLICY IF EXISTS "select_own_activity_logs" ON activity_logs;
CREATE POLICY "select_own_activity_logs" ON activity_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_activity_logs" ON activity_logs;
CREATE POLICY "insert_own_activity_logs" ON activity_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- =============================================
-- FEATURE_FLAGS TABLE (shared reference)
-- =============================================
CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key text NOT NULL UNIQUE,
  description text,
  is_enabled boolean NOT NULL DEFAULT false,
  rollout_percentage integer NOT NULL DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  targeting_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_all_feature_flags" ON feature_flags;
CREATE POLICY "select_all_feature_flags" ON feature_flags FOR SELECT
  TO authenticated USING (true);

-- =============================================
-- USER_FEATURE_FLAGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  flag_key text NOT NULL REFERENCES feature_flags(flag_key) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_feature_flags ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_feature_flags_user_key ON user_feature_flags(user_id, flag_key);

DROP POLICY IF EXISTS "select_own_user_feature_flags" ON user_feature_flags;
CREATE POLICY "select_own_user_feature_flags" ON user_feature_flags FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "upsert_own_user_feature_flags" ON user_feature_flags;
CREATE POLICY "upsert_own_user_feature_flags" ON user_feature_flags FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_user_feature_flags" ON user_feature_flags;
CREATE POLICY "update_own_user_feature_flags" ON user_feature_flags FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================
-- LOGIN_ATTEMPTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address inet,
  user_agent text,
  success boolean NOT NULL DEFAULT false,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);

-- Users can only INSERT login attempts (no reading other users' attempts)
DROP POLICY IF EXISTS "insert_login_attempts" ON login_attempts;
CREATE POLICY "insert_login_attempts" ON login_attempts FOR INSERT
  TO authenticated WITH CHECK (true);

-- =============================================
-- USER_SESSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token_hash text NOT NULL,
  device_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address inet,
  last_active_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

DROP POLICY IF EXISTS "select_own_user_sessions" ON user_sessions;
CREATE POLICY "select_own_user_sessions" ON user_sessions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_user_sessions" ON user_sessions;
CREATE POLICY "delete_own_user_sessions" ON user_sessions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- NOTIFICATION_PREFERENCES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled boolean NOT NULL DEFAULT true,
  push_enabled boolean NOT NULL DEFAULT true,
  in_app_enabled boolean NOT NULL DEFAULT true,
  category_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  quiet_hours_start time,
  quiet_hours_end time,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notification_preferences" ON notification_preferences;
CREATE POLICY "select_own_notification_preferences" ON notification_preferences FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_notification_preferences" ON notification_preferences;
CREATE POLICY "insert_own_notification_preferences" ON notification_preferences FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_notification_preferences" ON notification_preferences;
CREATE POLICY "update_own_notification_preferences" ON notification_preferences FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================
-- SEARCH_HISTORY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  query text NOT NULL,
  query_type text,
  results_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at DESC);

DROP POLICY IF EXISTS "select_own_search_history" ON search_history;
CREATE POLICY "select_own_search_history" ON search_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_search_history" ON search_history;
CREATE POLICY "insert_own_search_history" ON search_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_search_history" ON search_history;
CREATE POLICY "delete_own_search_history" ON search_history FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- FAVORITES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
  token_symbol text NOT NULL,
  token_address text,
  network text NOT NULL DEFAULT 'SOLANA',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_user_symbol ON favorites(user_id, token_symbol, network);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

DROP POLICY IF EXISTS "select_own_favorites" ON favorites;
CREATE POLICY "select_own_favorites" ON favorites FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_favorites" ON favorites;
CREATE POLICY "insert_own_favorites" ON favorites FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_favorites" ON favorites;
CREATE POLICY "delete_own_favorites" ON favorites FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_favorites" ON favorites;
CREATE POLICY "update_own_favorites" ON favorites FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================
-- UPDATED_AT TRIGGERS
-- =============================================
DROP TRIGGER IF EXISTS trg_workspaces_updated_at ON workspaces;
CREATE TRIGGER trg_workspaces_updated_at BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_workspace_widgets_updated_at ON workspace_widgets;
CREATE TRIGGER trg_workspace_widgets_updated_at BEFORE UPDATE ON workspace_widgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_feature_flags_updated_at ON feature_flags;
CREATE TRIGGER trg_feature_flags_updated_at BEFORE UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER trg_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
