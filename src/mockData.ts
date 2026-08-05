import type {
  Candle,
  ExecutionLog,
  GatekeeperReport,
  OrderBook,
  OrderBookLevel,
  Position,
  PredictiveSignal,
  SystemDiagnostics,
  TickerCandidate,
} from '@/types';

const SOL_MINTS = [
  '4k3Dyjzvzp8eLXwNrcA_MOCK',
  '7vfCXTUXx5WJV5J4k58hZ9b...',
  'EPjFWdd5AufqSSqeM2qN1xzy...',
  ' DezXAZ8z7PnrnRJjw3JfKq...',
  'rndrizKT3MK1LeimVV5qxK...',
];

const MEME_NAMES = [
  { sym: 'WIFHAT', name: 'dogwifhat' },
  { sym: 'BONK', name: 'Bonk' },
  { sym: 'PEPEZ', name: 'Pepe Zilla' },
  { sym: 'MOON', name: 'MoonShot' },
  { sym: 'FROG', name: 'Froggy' },
  { sym: 'SLAY', name: 'SlayCoin' },
  { sym: 'RAID', name: 'Raiden' },
  { sym: 'GOKU', name: 'GokuInu' },
  { sym: 'NOVA', name: 'NovaPad' },
  { sym: 'ZEX', name: 'ZephyrX' },
  { sym: 'ORBT', name: 'Orbital' },
  { sym: 'VOLT', name: 'VoltEdge' },
];

const WHALE_TAGS = [
  'Whale_Alpha_04',
  'SmartMoney_07',
  'Insider_12',
  'Dex_Sniper_03',
];

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shortAddr(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let s = '';
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s + '...';
}

export function genTicker(network: TickerCandidate['network'], idx: number): TickerCandidate {
  const meta = MEME_NAMES[idx % MEME_NAMES.length];
  const price = rand(0.0001, 0.5);
  const liquidity = rand(15000, 280000);
  const volume24h = liquidity * rand(0.3, 18);
  const change = rand(-32, 85);
  return {
    id: `tk-${idx}-${Math.random().toString(36).slice(2, 6)}`,
    symbol: meta.sym,
    name: meta.name,
    network,
    address: shortAddr(),
    price,
    changePct: change,
    holderVelocity: rand(-1.2, 5.8),
    volume24h,
    liquidity,
    vlr: volume24h / liquidity,
    ageMinutes: randInt(2, 240),
    securityScore: randInt(35, 99),
    flagged: Math.random() < 0.18,
  };
}

export function genTickers(count: number): TickerCandidate[] {
  const networks: TickerCandidate['network'][] = ['SOLANA', 'ETHEREUM', 'BASE', 'CEX'];
  return Array.from({ length: count }, (_, i) => genTicker(networks[i % networks.length], i));
}

export function genCandles(count: number, basePrice: number): Candle[] {
  const candles: Candle[] = [];
  let price = basePrice;
  const now = Date.now();
  for (let i = count; i > 0; i--) {
    const open = price;
    const volatility = price * 0.035;
    const close = Math.max(0.00001, open + rand(-volatility, volatility));
    const high = Math.max(open, close) + rand(0, volatility * 0.6);
    const low = Math.min(open, close) - rand(0, volatility * 0.6);
    candles.push({
      time: now - i * 60000,
      open,
      high,
      low,
      close,
      volume: rand(1000, 80000),
    });
    price = close;
  }
  return candles;
}

export function genPositions(): Position[] {
  const pos: Position[] = [];
  for (let i = 0; i < 4; i++) {
    const meta = pick(MEME_NAMES);
    const entry = rand(0.001, 0.08);
    const current = entry * rand(0.82, 1.45);
    const size = rand(50, 1200);
    const pnlPct = ((current - entry) / entry) * 100;
    pos.push({
      id: `pos_${randInt(100000, 999999)}`,
      symbol: meta.sym,
      network: pick(['SOLANA', 'ETHEREUM', 'BASE']) as Position['network'],
      entryPrice: entry,
      currentPrice: current,
      size,
      pnlPct,
      pnlUsd: (current - entry) * size * 1000,
      highestPrice: Math.max(entry, current) * rand(1.0, 1.12),
      stopLoss: entry * 0.88,
      ageMinutes: randInt(1, 38),
      status: pick(['OPEN', 'TRAILING', 'EXITING']) as Position['status'],
    });
  }
  return pos;
}

export function genGatekeeperReport(symbol?: string): GatekeeperReport {
  const passed = Math.random() > 0.3;
  return {
    tokenAddress: SOL_MINTS[0],
    tokenSymbol: symbol ?? pick(MEME_NAMES).sym,
    securityVerdict: passed ? 'PASSED' : Math.random() > 0.5 ? 'REVIEW' : 'REJECTED',
    isMintable: Math.random() < 0.12,
    ownershipStatus: Math.random() > 0.2 ? 'RENOUNCED' : 'NOT_RENOUNCED',
    buyTaxPct: rand(0, 8),
    sellTaxPct: rand(0, 12),
    liquidityBurnedRatio: rand(0.5, 1.0),
    lpLocked: Math.random() > 0.25,
    lockDurationDays: randInt(30, 365),
    honeypotScore: rand(0, 0.3),
  };
}

export function genPredictiveSignal(symbol?: string): PredictiveSignal {
  const breakout = rand(0.05, 0.97);
  const drain = rand(0.005, 0.15);
  const noAlpha = Math.max(0, 1 - breakout - drain);
  let verdict: PredictiveSignal['verdict'] = 'MONITOR';
  if (breakout >= 0.82 && drain <= 0.03) verdict = 'EXECUTE_PIPELINE';
  else if (drain > 0.1) verdict = 'REJECT';
  return {
    tokenSymbol: symbol ?? pick(MEME_NAMES).sym,
    holderVelocitySigma: rand(-1.5, 5.5),
    vlrCoefficient: rand(0.5, 18),
    samScore: rand(-8, 16),
    breakoutProb: breakout,
    drainRiskProb: drain,
    noAlphaProb: noAlpha,
    verdict,
    whaleIntersections: Math.random() < 0.4
      ? [{ tag: pick(WHALE_TAGS), type: 'SWAP_IN' }]
      : [],
  };
}

export function genDiagnostics(): SystemDiagnostics {
  return {
    rpcLatencyMs: randInt(1, 12),
    fifoQueueDepth: randInt(0, 240),
    cpuPct: rand(8, 32),
    ramBytes: randInt(800, 1600) * 1024 * 1024,
    ingestionRate: rand(2400, 9800),
    modelLogLoss: rand(0.18, 0.34),
  };
}

export function genExecutionLogs(count: number): ExecutionLog[] {
  const actions: ExecutionLog['action'][] = ['BUY', 'SELL', 'CANCEL', 'RETRY'];
  const statuses: ExecutionLog['status'][] = ['CONFIRMED', 'PENDING', 'FAILED'];
  const relays = ['Jito_Bundle_04', 'Flashbots_Protect', 'Helius_Private', 'QuickNode_Direct'];
  return Array.from({ length: count }, () => {
    const action = pick(actions);
    return {
      id: `log-${Math.random().toString(36).slice(2, 8)}`,
      time: new Date(Date.now() - randInt(1000, 900000)).toISOString(),
      symbol: pick(MEME_NAMES).sym,
      action,
      amount: rand(0.01, 5),
      price: rand(0.001, 0.5),
      status: pick(statuses),
      relay: pick(relays),
      tip: rand(0.001, 0.05),
    };
  });
}

export function genOrderBook(midPrice: number): OrderBook {
  const levels = 12;
  const bids: OrderBookLevel[] = [];
  const asks: OrderBookLevel[] = [];
  for (let i = 0; i < levels; i++) {
    const spread = midPrice * 0.002 * (i + 1);
    bids.push({
      price: midPrice - spread,
      size: rand(500, 80000) / (i + 1.5),
    });
    asks.push({
      price: midPrice + spread,
      size: rand(500, 80000) / (i + 1.5),
    });
  }
  return { bids, asks };
}

export function updateTicker(t: TickerCandidate): TickerCandidate {
  const drift = t.price * rand(-0.04, 0.045);
  const newPrice = Math.max(0.0000001, t.price + drift);
  const newChange = t.changePct + rand(-3, 3);
  return {
    ...t,
    price: newPrice,
    changePct: newChange,
    holderVelocity: Math.max(-2, t.holderVelocity + rand(-0.5, 0.5)),
    vlr: Math.max(0, t.vlr + rand(-0.5, 0.5)),
    volume24h: t.volume24h + rand(-500, 5000),
  };
}

export function updatePosition(p: Position): Position {
  const drift = p.currentPrice * rand(-0.025, 0.03);
  const newPrice = Math.max(0.0000001, p.currentPrice + drift);
  const pnlPct = ((newPrice - p.entryPrice) / p.entryPrice) * 100;
  const highest = Math.max(p.highestPrice, newPrice);
  return {
    ...p,
    currentPrice: newPrice,
    pnlPct,
    pnlUsd: (newPrice - p.entryPrice) * p.size * 1000,
    highestPrice: highest,
    stopLoss: highest * 0.92,
    ageMinutes: p.ageMinutes + 0.05,
  };
}

export function updateCandles(candles: Candle[], basePrice: number): Candle[] {
  const last = candles[candles.length - 1];
  const volatility = last.close * 0.02;
  const newClose = Math.max(0.0000001, last.close + rand(-volatility, volatility));
  const updated = [...candles.slice(1), {
    time: Date.now(),
    open: last.close,
    high: Math.max(last.close, newClose) + rand(0, volatility * 0.4),
    low: Math.min(last.close, newClose) - rand(0, volatility * 0.4),
    close: newClose,
    volume: rand(1000, 60000),
  }];
  return updated;
}

export { MEME_NAMES, WHALE_TAGS, SOL_MINTS };
