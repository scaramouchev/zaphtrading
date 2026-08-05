import { supabase } from '@/lib/supabase';
import { AppError, getErrorMessage, withRetry } from '@/lib/errors';

export interface Strategy {
  id: string;
  user_id: string;
  strategy_name: string;
  network_target: string;
  asset_targets: string[];
  execution_parameters: Record<string, unknown>;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateStrategyInput {
  strategy_name: string;
  network_target: string;
  asset_targets?: string[];
  execution_parameters?: Record<string, unknown>;
  is_enabled?: boolean;
}

export interface Watchlist {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface WatchlistItem {
  id: string;
  watchlist_id: string;
  token_symbol: string;
  token_address: string;
  network: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Position {
  id: string;
  user_id: string;
  token_symbol: string;
  token_address: string | null;
  network: string;
  position_type: string;
  entry_price: number;
  current_price: number;
  size: number;
  pnl_pct: number;
  pnl_usd: number;
  highest_price: number;
  stop_loss: number;
  age_minutes: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  user_id: string;
  token_symbol: string;
  token_address: string | null;
  network: string;
  alert_type: string;
  condition: Record<string, unknown>;
  is_active: boolean;
  triggered_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  network: string;
  contract_address: string | null;
  decimals: number;
  category: string;
  logo_url: string | null;
  market_cap: number | null;
  circulating_supply: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Exchange {
  id: string;
  exchange_code: string;
  display_name: string;
  api_endpoint: string | null;
  status: string;
  supported_networks: string[];
  logo_url: string | null;
  created_at: string;
}

export interface Prediction {
  id: string;
  user_id: string;
  asset_id: string | null;
  token_symbol: string;
  prediction_class: number;
  confidence: number;
  model_version: string;
  features_used: Record<string, unknown>;
  generated_at: string;
  expires_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  category: string;
  title: string;
  message: string;
  is_read: boolean;
  is_pinned: boolean;
  is_archived: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  tier_level: string;
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

function handleResult<T>(
  result: { data: T | null; error: { code?: string; message: string; status?: number } | null },
  operation: string,
): T {
  if (result.error) {
    throw AppError.fromSupabase(result.error);
  }
  if (result.data === null) {
    throw new AppError(`No data returned for ${operation}`, 'NOT_FOUND', 404);
  }
  return result.data;
}

export const api = {
  strategies: {
    async list(): Promise<Strategy[]> {
      return withRetry(async () => {
        const { data, error } = await supabase
          .from('strategies')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw AppError.fromSupabase(error);
        return data as Strategy[];
      });
    },

    async create(input: CreateStrategyInput): Promise<Strategy> {
      return withRetry(async () => {
        const { data, error } = await supabase
          .from('strategies')
          .insert(input)
          .select()
          .maybeSingle();
        return handleResult({ data, error }, 'create strategy');
      });
    },

    async update(id: string, updates: Partial<Strategy>): Promise<Strategy> {
      return withRetry(async () => {
        const { data, error } = await supabase
          .from('strategies')
          .update(updates)
          .eq('id', id)
          .select()
          .maybeSingle();
        return handleResult({ data, error }, 'update strategy');
      });
    },

    async remove(id: string): Promise<void> {
      return withRetry(async () => {
        const { error } = await supabase.from('strategies').delete().eq('id', id);
        if (error) throw AppError.fromSupabase(error);
      });
    },

    async toggle(id: string, enabled: boolean): Promise<Strategy> {
      return this.update(id, { is_enabled: enabled });
    },
  },

  watchlists: {
    async list(): Promise<Watchlist[]> {
      return withRetry(async () => {
        const { data, error } = await supabase
          .from('watchlists')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw AppError.fromSupabase(error);
        return data as Watchlist[];
      });
    },

    async create(name: string): Promise<Watchlist> {
      return withRetry(async () => {
        const { data, error } = await supabase
          .from('watchlists')
          .insert({ name })
          .select()
          .maybeSingle();
        return handleResult({ data, error }, 'create watchlist');
      });
    },

    async remove(id: string): Promise<void> {
      return withRetry(async () => {
        const { error } = await supabase.from('watchlists').delete().eq('id', id);
        if (error) throw AppError.fromSupabase(error);
      });
    },

    async items(watchlistId: string): Promise<WatchlistItem[]> {
      return withRetry(async () => {
        const { data, error } = await supabase
          .from('watchlist_items')
          .select('*')
          .eq('watchlist_id', watchlistId)
          .order('created_at', { ascending: false });
        if (error) throw AppError.fromSupabase(error);
        return data as WatchlistItem[];
      });
    },

    async addItem(watchlistId: string, item: Omit<WatchlistItem, 'id' | 'watchlist_id' | 'created_at'>): Promise<WatchlistItem> {
      return withRetry(async () => {
        const { data, error } = await supabase
          .from('watchlist_items')
          .insert({ watchlist_id: watchlistId, ...item })
          .select()
          .maybeSingle();
        return handleResult({ data, error }, 'add watchlist item');
      });
    },

    async removeItem(itemId: string): Promise<void> {
      return withRetry(async () => {
        const { error } = await supabase.from('watchlist_items').delete().eq('id', itemId);
        if (error) throw AppError.fromSupabase(error);
      });
    },
  },

  positions: {
    async list(): Promise<Position[]> {
      return withRetry(async () => {
        const { data, error } = await supabase
          .from('positions')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw AppError.fromSupabase(error);
        return data as Position[];
      });
    },

    async create(input: Omit<Position, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'pnl_pct' | 'pnl_usd' | 'highest_price' | 'age_minutes' | 'status'>): Promise<Position> {
      return withRetry(async () => {
        const { data, error } = await supabase
          .from('positions')
          .insert({
            ...input,
            highest_price: input.entry_price,
            stop_loss: input.entry_price * 0.88,
          })
          .select()
          .maybeSingle();
        return handleResult({ data, error }, 'create position');
      });
    },

    async update(id: string, updates: Partial<Position>): Promise<Position> {
      return withRetry(async () => {
        const { data, error } = await supabase
          .from('positions')
          .update(updates)
          .eq('id', id)
          .select()
          .maybeSingle();
        return handleResult({ data, error }, 'update position');
      });
    },

    async close(id: string): Promise<Position> {
      return this.update(id, { status: 'CLOSED' });
    },

    async remove(id: string): Promise<void> {
      return withRetry(async () => {
        const { error } = await supabase.from('positions').delete().eq('id', id);
        if (error) throw AppError.fromSupabase(error);
      });
    },
  },

  alerts: {
    async list(): Promise<Alert[]> {
      return withRetry(async () => {
        const { data, error } = await supabase
          .from('alerts')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw AppError.fromSupabase(error);
        return data as Alert[];
      });
    },

    async create(input: Omit<Alert, 'id' | 'user_id' | 'created_at' | 'triggered_at'>): Promise<Alert> {
      return withRetry(async () => {
        const { data, error } = await supabase
          .from('alerts')
          .insert(input)
          .select()
          .maybeSingle();
        return handleResult({ data, error }, 'create alert');
      });
    },

    async update(id: string, updates: Partial<Alert>): Promise<Alert> {
      return withRetry(async () => {
        const { data, error } = await supabase
          .from('alerts')
          .update(updates)
          .eq('id', id)
          .select()
          .maybeSingle();
        return handleResult({ data, error }, 'update alert');
      });
    },

    async remove(id: string): Promise<void> {
      return withRetry(async () => {
        const { error } = await supabase.from('alerts').delete().eq('id', id);
        if (error) throw AppError.fromSupabase(error);
      });
    },
  },

  audit: {
    async list(limit = 50): Promise<AuditLog[]> {
      return withRetry(async () => {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);
        if (error) throw AppError.fromSupabase(error);
        return data as AuditLog[];
      });
    },

    async log(action: string, entityType?: string, entityId?: string, metadata?: Record<string, unknown>): Promise<void> {
      try {
        await supabase.from('audit_logs').insert({
          action,
          entity_type: entityType,
          entity_id: entityId,
          metadata: metadata || {},
        });
      } catch {
        // Audit logging is best-effort — don't block user actions
      }
    },
  },

  assets: {
    async list(): Promise<Asset[]> {
      return withRetry(async () => {
        const { data, error } = await supabase
          .from('assets')
          .select('*')
          .eq('is_active', true)
          .order('symbol', { ascending: true });
        if (error) throw AppError.fromSupabase(error);
        return data as Asset[];
      });
    },

    async getBySymbol(symbol: string, network?: string): Promise<Asset | null> {
      return withRetry(async () => {
        let query = supabase.from('assets').select('*').eq('symbol', symbol).eq('is_active', true);
        if (network) query = query.eq('network', network);
        const { data, error } = await query.maybeSingle();
        if (error) throw AppError.fromSupabase(error);
        return data as Asset | null;
      });
    },
  },

  exchanges: {
    async list(): Promise<Exchange[]> {
      return withRetry(async () => {
        const { data, error } = await supabase
          .from('exchanges')
          .select('*')
          .order('display_name', { ascending: true });
        if (error) throw AppError.fromSupabase(error);
        return data as Exchange[];
      });
    },
  },

  predictions: {
    async list(limit = 20): Promise<Prediction[]> {
      return withRetry(async () => {
        const { data, error } = await supabase
          .from('predictions')
          .select('*')
          .order('generated_at', { ascending: false })
          .limit(limit);
        if (error) throw AppError.fromSupabase(error);
        return data as Prediction[];
      });
    },

    async create(input: Omit<Prediction, 'id' | 'user_id' | 'generated_at'>): Promise<Prediction> {
      return withRetry(async () => {
        const { data, error } = await supabase
          .from('predictions')
          .insert(input)
          .select()
          .maybeSingle();
        return handleResult({ data, error }, 'create prediction');
      });
    },

    async remove(id: string): Promise<void> {
      return withRetry(async () => {
        const { error } = await supabase.from('predictions').delete().eq('id', id);
        if (error) throw AppError.fromSupabase(error);
      });
    },
  },

  notifications: {
    async list(limit = 50): Promise<Notification[]> {
      return withRetry(async () => {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('is_archived', false)
          .order('created_at', { ascending: false })
          .limit(limit);
        if (error) throw AppError.fromSupabase(error);
        return data as Notification[];
      });
    },

    async create(input: Omit<Notification, 'id' | 'user_id' | 'created_at'>): Promise<Notification> {
      return withRetry(async () => {
        const { data, error } = await supabase
          .from('notifications')
          .insert(input)
          .select()
          .maybeSingle();
        return handleResult({ data, error }, 'create notification');
      });
    },

    async markRead(id: string): Promise<void> {
      return withRetry(async () => {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', id);
        if (error) throw AppError.fromSupabase(error);
      });
    },

    async markAllRead(): Promise<void> {
      return withRetry(async () => {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('is_read', false);
        if (error) throw AppError.fromSupabase(error);
      });
    },

    async togglePin(id: string, pinned: boolean): Promise<void> {
      return withRetry(async () => {
        const { error } = await supabase
          .from('notifications')
          .update({ is_pinned: pinned })
          .eq('id', id);
        if (error) throw AppError.fromSupabase(error);
      });
    },

    async archive(id: string): Promise<void> {
      return withRetry(async () => {
        const { error } = await supabase
          .from('notifications')
          .update({ is_archived: true })
          .eq('id', id);
        if (error) throw AppError.fromSupabase(error);
      });
    },

    async remove(id: string): Promise<void> {
      return withRetry(async () => {
        const { error } = await supabase.from('notifications').delete().eq('id', id);
        if (error) throw AppError.fromSupabase(error);
      });
    },
  },

  profiles: {
    async get(): Promise<UserProfile | null> {
      return withRetry(async () => {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .maybeSingle();
        if (error) throw AppError.fromSupabase(error);
        return data as UserProfile | null;
      });
    },

    async update(updates: Partial<Pick<UserProfile, 'display_name' | 'avatar_url' | 'preferences'>>): Promise<UserProfile> {
      return withRetry(async () => {
        const { data, error } = await supabase
          .from('user_profiles')
          .update(updates)
          .select()
          .maybeSingle();
        return handleResult({ data, error }, 'update profile');
      });
    },
  },
};

export { AppError, getErrorMessage };
