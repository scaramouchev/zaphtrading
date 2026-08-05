import { create } from 'zustand';

interface UIState {
  isBotRunning: boolean;
  toggleBotStatus: () => void;
  setBotRunning: (running: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isBotRunning: false,
  toggleBotStatus: () => set((state) => ({ isBotRunning: !state.isBotRunning })),
  setBotRunning: (running) => set({ isBotRunning: running }),
}));
