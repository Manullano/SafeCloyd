import { create } from 'zustand';

interface UIStore {
  isNavOpen: boolean;
  toggleNav: () => void;
  closeNav: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isNavOpen: false,
  toggleNav: () => set((state) => ({ isNavOpen: !state.isNavOpen })),
  closeNav: () => set({ isNavOpen: false }),
}));
