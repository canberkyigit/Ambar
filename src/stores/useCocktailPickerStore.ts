import { create } from 'zustand';

export interface PickedCocktail {
  id: string;
  name: string;
}

interface CocktailPickerState {
  pendingSelection: PickedCocktail | null;
  setPendingSelection: (cocktail: PickedCocktail | null) => void;
  clearPendingSelection: () => void;
}

export const useCocktailPickerStore = create<CocktailPickerState>((set) => ({
  pendingSelection: null,
  setPendingSelection: (cocktail) => set({ pendingSelection: cocktail }),
  clearPendingSelection: () => set({ pendingSelection: null }),
}));
