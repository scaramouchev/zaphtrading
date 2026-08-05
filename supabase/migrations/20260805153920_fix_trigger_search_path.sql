/*
# Fix search_path security on trigger function

## Purpose
Sets a secure search_path on the update_updated_at_column trigger function to prevent search_path manipulation attacks.

## Changes
- Drops and recreates triggers, then recreates the function with explicit search_path = public.
- Re-creates all three triggers that depend on the function.
*/

DROP TRIGGER IF EXISTS trg_strategies_updated_at ON strategies;
DROP TRIGGER IF EXISTS trg_watchlists_updated_at ON watchlists;
DROP TRIGGER IF EXISTS trg_positions_updated_at ON positions;

DROP FUNCTION IF EXISTS update_updated_at_column();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_strategies_updated_at BEFORE UPDATE ON strategies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_watchlists_updated_at BEFORE UPDATE ON watchlists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_positions_updated_at BEFORE UPDATE ON positions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
