export type Network = 'SOLANA' | 'ETHEREUM' | 'BASE' | 'CEX';

export interface TickerCandidate {
  id: string;
  symbol: string;
  name: string;
  network: Network;
  address: string;
  price: number;
  changePct: number;
  holderVelocity: number;
  volume24h: number;
  liquidity: number;
  vlr: number;
  ageMinutes: number;
  securityScore: number;
  flagged: boolean;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Position {
  id: string;
  symbol: string;
  network: Network;
  entryPrice: number;
  currentPrice: number;
  size: number;
  pnlPct: number;
  pnlUsd: number;
  highestPrice: number;
  stopLoss: number;
  ageMinutes: number;
  status: 'OPEN' | 'TRAILING' | 'EXITING';
}

export interface GatekeeperReport {
  tokenAddress: string;
  tokenSymbol: string;
  securityVerdict: 'PASSED' | 'REVIEW' | 'REJECTED';
  isMintable: boolean;
  ownershipStatus: string;
  buyTaxPct: number;
  sellTaxPct: number;
  liquidityBurnedRatio: number;
  lpLocked: boolean;
  lockDurationDays: number;
  honeypotScore: number;
}

export interface PredictiveSignal {
  tokenSymbol: string;
  holderVelocitySigma: number;
  vlrCoefficient: number;
  samScore: number;
  breakoutProb: number;
  drainRiskProb: number;
  noAlphaProb: number;
  verdict: 'EXECUTE_PIPELINE' | 'MONITOR' | 'REJECT';
  whaleIntersections: { tag: string; type: string }[];
}

export interface SystemDiagnostics {
  rpcLatencyMs: number;
  fifoQueueDepth: number;
  cpuPct: number;
  ramBytes: number;
  ingestionRate: number;
  modelLogLoss: number;
}

export interface ExecutionLog {
  id: string;
  time: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'CANCEL' | 'RETRY';
  amount: number;
  price: number;
  status: 'CONFIRMED' | 'PENDING' | 'FAILED';
  relay: string;
  tip: number;
}

export interface OrderBookLevel {
  price: number;
  size: number;
}

export interface OrderBook {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}
