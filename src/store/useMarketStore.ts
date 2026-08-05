import { create } from 'zustand';
import type {
  Candle,
  GatekeeperReport,
  OrderBook,
  PredictiveSignal,
  SystemDiagnostics,
  TickerCandidate,
} from '@/types';
import { MockMarketDataProvider } from '@/providers/MockMarketDataProvider';
import type { MarketDataProvider } from '@/providers/MarketDataProvider';

interface MarketState {
  provider: MarketDataProvider;
  tickers: TickerCandidate[];
  candles: Candle[];
  orderBook: OrderBook;
  diagnostics: SystemDiagnostics;
  gatekeeper: GatekeeperReport;
  signal: PredictiveSignal;
  activeSymbol: string;
  activeNetwork: string;
  isStreaming: boolean;

  initialize: () => void;
  setActiveSymbol: (symbol: string) => void;
  setActiveNetwork: (network: string) => void;
  refreshGatekeeper: (symbol: string) => void;
  refreshSignal: (symbol: string) => void;
}

const mockProvider = new MockMarketDataProvider();

export const useMarketStore = create<MarketState>((set, get) => ({
  provider: mockProvider,
  tickers: mockProvider.getTickers(),
  candles: mockProvider.getCandles('WIFHAT'),
  orderBook: mockProvider.getOrderBook('WIFHAT'),
  diagnostics: mockProvider.getDiagnostics(),
  gatekeeper: mockProvider.getGatekeeperReport('WIFHAT'),
  signal: mockProvider.getPredictiveSignal('WIFHAT'),
  activeSymbol: 'WIFHAT',
  activeNetwork: 'SOLANA',
  isStreaming: false,

  initialize: () => {
    const provider = get().provider;
    provider.subscribe((update) => {
      set({
        tickers: update.tickers,
        candles: update.candles,
        orderBook: update.orderBook,
        diagnostics: update.diagnostics,
      });
    });
    provider.start();
    set({ isStreaming: true });
  },

  setActiveSymbol: (symbol) => {
    set({ activeSymbol: symbol });
    get().refreshGatekeeper(symbol);
    get().refreshSignal(symbol);
  },

  setActiveNetwork: (network) => set({ activeNetwork: network }),

  refreshGatekeeper: (symbol) => {
    set({ gatekeeper: get().provider.getGatekeeperReport(symbol) });
  },

  refreshSignal: (symbol) => {
    set({ signal: get().provider.getPredictiveSignal(symbol) });
  },
}));
