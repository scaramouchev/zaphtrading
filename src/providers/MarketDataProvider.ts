import type {
  Candle,
  GatekeeperReport,
  OrderBook,
  Position,
  PredictiveSignal,
  SystemDiagnostics,
  TickerCandidate,
} from '@/types';

export interface MarketDataProvider {
  readonly name: string;

  getTickers(): TickerCandidate[];
  getCandles(symbol: string): Candle[];
  getOrderBook(symbol: string): OrderBook;
  getPositions(): Position[];
  getGatekeeperReport(symbol: string): GatekeeperReport;
  getPredictiveSignal(symbol: string): PredictiveSignal;
  getDiagnostics(): SystemDiagnostics;

  subscribe(callback: (update: MarketUpdate) => void): () => void;
  start(): void;
  stop(): void;
}

export interface MarketUpdate {
  tickers: TickerCandidate[];
  candles: Candle[];
  positions: Position[];
  orderBook: OrderBook;
  diagnostics: SystemDiagnostics;
}
