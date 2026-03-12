import { create } from "zustand";
import type { InvoiceItem, DocumentType } from "@/types";
import { generateId, calculateTotal } from "@/lib/utils";

interface InvoiceState {
  id: string;
  customerName: string;
  customerPhone: string;
  items: InvoiceItem[];
  total: number;
  type: DocumentType;
  highlightedItemId: string | null;
  transcript: string;
  isListening: boolean;
  isProcessing: boolean;
  isConnected: boolean;
  error: string | null;
}

interface InvoiceActions {
  setCustomer: (name: string, phone?: string) => void;
  addItem: (description: string, quantity: number, unitPrice: number) => void;
  removeItem: (index: number) => void;
  updateItem: (id: string, updates: Partial<InvoiceItem>) => void;
  setType: (type: DocumentType) => void;
  setHighlightedItem: (id: string | null) => void;
  setTranscript: (transcript: string) => void;
  setListening: (isListening: boolean) => void;
  setProcessing: (isProcessing: boolean) => void;
  setConnected: (isConnected: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: InvoiceState = {
  id: generateId(),
  customerName: "",
  customerPhone: "",
  items: [],
  total: 0,
  type: "quote",
  highlightedItemId: null,
  transcript: "",
  isListening: false,
  isProcessing: false,
  isConnected: false,
  error: null,
};

export const useInvoiceStore = create<InvoiceState & InvoiceActions>((set, get) => ({
  ...initialState,

  setCustomer: (name, phone) => {
    set({ customerName: name, customerPhone: phone || "" });
  },

  addItem: (description, quantity, unitPrice) => {
    const newItem: InvoiceItem = {
      id: generateId(),
      description,
      quantity,
      unitPrice,
    };

    set((state) => {
      const newItems = [...state.items, newItem];
      return {
        items: newItems,
        total: calculateTotal(newItems),
        highlightedItemId: newItem.id,
      };
    });

    // Clear highlight after animation
    setTimeout(() => {
      set({ highlightedItemId: null });
    }, 2000);
  },

  removeItem: (index) => {
    set((state) => {
      // Handle negative index (e.g., -1 for last item)
      const actualIndex = index < 0 ? state.items.length + index : index;
      
      if (actualIndex < 0 || actualIndex >= state.items.length) {
        return state;
      }

      const newItems = state.items.filter((_, i) => i !== actualIndex);
      return {
        items: newItems,
        total: calculateTotal(newItems),
      };
    });
  },

  updateItem: (id, updates) => {
    set((state) => {
      const newItems = state.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      );
      return {
        items: newItems,
        total: calculateTotal(newItems),
        highlightedItemId: id,
      };
    });

    setTimeout(() => {
      set({ highlightedItemId: null });
    }, 2000);
  },

  setType: (type) => set({ type }),

  setHighlightedItem: (id) => set({ highlightedItemId: id }),

  setTranscript: (transcript) => set({ transcript }),

  setListening: (isListening) => set({ isListening }),

  setProcessing: (isProcessing) => set({ isProcessing }),

  setConnected: (isConnected) => set({ isConnected }),

  setError: (error) => set({ error }),

  reset: () => set({ ...initialState, id: generateId() }),
}));
