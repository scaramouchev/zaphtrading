import type { MarketDataProvider, MarketUpdate } from './MarketDataProvider';
import type {
  Candle,
  GatekeeperReport,
  OrderBook,
  Position,
  PredictiveSignal,
  SystemDiagnostics,
  TickerCandidate,
} from '@/types';
import {
  genCandles,
  genDiagnostics,
  genExecutionLogs,
  genGatekeeperReport,
  genOrderBook,
  genPositions,
  genPredictiveSignal,
  genTickers,
  updateCandles,
  updatePosition,
  updateTicker,
} from '@/mockData';

export class MockMarketDataProvider implements MarketDataProvider {
  readonly name = 'mock';

  private tickers: TickerCandidate[];
  private candles: Candle[];
  private positions: Position[];
  private orderBook: OrderBook;
  private diagnostics: SystemDiagnostics;
  private callbacks: Set<(update: MarketUpdate) => void> = new Set();
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private slowInterval: ReturnType<typeof setInterval> | null = null;
  private gateInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.tickers = genTickers(14);
    this.candles = genCandles(80, 0.0042);
    this.positions = genPositions();
    this.orderBook = genOrderBook(0.0042);
    this.diagnostics = genDiagnostics();
  }

  getTickers(): TickerCandidate[] {
    return this.tickers;
  }

  getCandles(_symbol: string): Candle[] {
    return this.candles;
  }

  getOrderBook(_symbol: string): OrderBook {
    return this.orderBook;
  }

  getPositions(): Position[] {
    return this.positions;
  }

  getGatekeeperReport(symbol: string): GatekeeperReport {
    return genGatekeeperReport(symbol);
  }

  getPredictiveSignal(symbol: string): PredictiveSignal {
    return genPredictiveSignal(symbol);
  }

  getDiagnostics(): SystemDiagnostics {
    return this.diagnostics;
  }

  subscribe(callback: (update: MarketUpdate) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  start(): void {
    if (this.tickInterval) return;

    this.tickInterval = setInterval(() => {
      this.tickers = this.tickers.map(updateTicker);
      this.candles = updateCandles(this.candles, 0.0042);
      this.positions = this.positions.map(updatePosition);
      const lastPrice = this.candles[this.candles.length - 1].close;
      this.orderBook = genOrderBook(lastPrice);
      this.diagnostics = genDiagnostics();
      this.emit();
    }, 1000);

    this.slowInterval = setInterval(() => {
      this.diagnostics = genDiagnostics();
      this.emit();
    }, 2500);
  }

  stop(): void {
    if (this.tickInterval) clearInterval(this.tickInterval);
    if (this.slowInterval) clearInterval(this.slowInterval);
    if (this.gateInterval) clearInterval(this.gateInterval);
    this.tickInterval = null;
    this.slowInterval = null;
    this.gateInterval = null;
  }

  private emit(): void {
    const update: MarketUpdate = {
      tickers: this.tickers,
      candles: this.candles,
      positions: this.positions,
      orderBook: this.orderBook,
      diagnostics: this.diagnostics,
    };
    this.callbacks.forEach((cb) => cb(update));
  }
}

export { genExecutionLogs };
