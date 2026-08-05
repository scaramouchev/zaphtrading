import { create } from 'zustand';

interface RiskSettings {
  maxSlippagePct: number;
  maxPriceImpactPct: number;
  maxDrawdownPct: number;
  maxCapitalAllocationPct: number;
  trailingStopPct: number;
  antiRugGatekeeperEnabled: boolean;
  maxBuyTaxPct: number;
  maxSellTaxPct: number;
  requireBurnedLp: boolean;
}

interface RiskState extends RiskSettings {
  updateSetting: <K extends keyof RiskSettings>(key: K, value: RiskSettings[K]) => void;
  reset: () => void;
}

const DEFAULT_SETTINGS: RiskSettings = {
  maxSlippagePct: 5.0,
  maxPriceImpactPct: 2.0,
  maxDrawdownPct: 15.0,
  maxCapitalAllocationPct: 2.5,
  trailingStopPct: 8.0,
  antiRugGatekeeperEnabled: true,
  maxBuyTaxPct: 10.0,
  maxSellTaxPct: 10.0,
  requireBurnedLp: true,
};

export const useRiskStore = create<RiskState>((set) => ({
  ...DEFAULT_SETTINGS,
  updateSetting: (key, value) => set({ [key]: value } as Partial<RiskState>),
  reset: () => set({ ...DEFAULT_SETTINGS }),
}));
