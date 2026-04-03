import { create } from "zustand";
import type { ConversationMessage, InvoiceItem, DocumentType } from "@/types";
import { generateId, calculateTotal } from "@/lib/utils";

interface InvoiceState {
  id: string;
  customerName: string;
  customerPhone: string;
  items: InvoiceItem[];
  total: number;
  type: DocumentType;
  highlightedItemId: string | null;
  conversationMessages: ConversationMessage[];
  isListening: boolean;
  isProcessing: boolean;
  isConnected: boolean;
  error: string | null;
}

interface InvoiceActions {
  setCustomer: (name: string, phone?: string) => void;
  addItem: (description: string, quantity: number, unitPrice: number) => string;
  removeItem: (index: number) => void;
  updateItem: (id: string, updates: Partial<InvoiceItem>) => void;
  setType: (type: DocumentType) => void;
  setHighlightedItem: (id: string | null) => void;
  pushUserMessage: (text: string) => void;
  appendAssistantDelta: (delta: string) => void;
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
  conversationMessages: [],
  isListening: false,
  isProcessing: false,
  isConnected: false,
  error: null,
};

export const useInvoiceStore = create<InvoiceState & InvoiceActions>((set) => ({
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

    setTimeout(() => {
      set({ highlightedItemId: null });
    }, 2000);

    return newItem.id;
  },

  removeItem: (index) => {
    set((state) => {
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

  pushUserMessage: (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    set((state) => ({
      conversationMessages: [
        ...state.conversationMessages,
        {
          id: generateId(),
          role: "user",
          content: trimmed,
        },
      ],
    }));
  },

  appendAssistantDelta: (delta) => {
    if (!delta) return;
    set((state) => {
      const messages = [...state.conversationMessages];
      const last = messages[messages.length - 1];
      if (last?.role === "assistant") {
        messages[messages.length - 1] = {
          ...last,
          content: last.content + delta,
        };
      } else {
        messages.push({
          id: generateId(),
          role: "assistant",
          content: delta,
        });
      }
      return { conversationMessages: messages };
    });
  },

  setListening: (isListening) => set({ isListening }),

  setProcessing: (isProcessing) => set({ isProcessing }),

  setConnected: (isConnected) => set({ isConnected }),

  setError: (error) => set({ error }),

  reset: () => set({ ...initialState, id: generateId() }),
}));
