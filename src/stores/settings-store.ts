import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  businessName: string;
  businessPhone: string;
  businessAddress: string;
  quotePrefix: string;
  invoicePrefix: string;
  /** Taux de TVA en pourcentage (ex. 20 pour 20 %). */
  vatRatePercent: number;
  legalMentions: string;
  currency: "XOF" | "EUR" | "USD";
  openaiApiKey: string;
}

interface SettingsActions {
  setBusinessName: (name: string) => void;
  setBusinessPhone: (phone: string) => void;
  setBusinessAddress: (address: string) => void;
  setQuotePrefix: (prefix: string) => void;
  setInvoicePrefix: (prefix: string) => void;
  setVatRatePercent: (rate: number) => void;
  setLegalMentions: (mentions: string) => void;
  setCurrency: (currency: "XOF" | "EUR" | "USD") => void;
  setOpenaiApiKey: (key: string) => void;
  updateSettings: (updates: Partial<SettingsState>) => void;
}

const initialState: SettingsState = {
  businessName: "",
  businessPhone: "",
  businessAddress: "",
  quotePrefix: "DV-",
  invoicePrefix: "FAC-",
  vatRatePercent: 20,
  legalMentions: "",
  currency: "XOF",
  openaiApiKey: "",
};

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      ...initialState,

      setBusinessName: (name) => set({ businessName: name }),
      setBusinessPhone: (phone) => set({ businessPhone: phone }),
      setBusinessAddress: (address) => set({ businessAddress: address }),
      setQuotePrefix: (prefix) => set({ quotePrefix: prefix }),
      setInvoicePrefix: (prefix) => set({ invoicePrefix: prefix }),
      setVatRatePercent: (rate) => set({ vatRatePercent: rate }),
      setLegalMentions: (mentions) => set({ legalMentions: mentions }),
      setCurrency: (currency) => set({ currency }),
      setOpenaiApiKey: (key) => set({ openaiApiKey: key }),
      updateSettings: (updates) => set(updates),
    }),
    {
      name: "artisan-voice-settings",
    }
  )
);
