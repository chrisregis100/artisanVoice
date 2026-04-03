export interface User {
  id: string;
  email: string;
  businessName: string;
  phone: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  userId: string;
  name: string;
  phone: string | null;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  createdAt?: string;
}

export interface Invoice {
  id: string;
  userId: string;
  customerId: string | null;
  customerName: string;
  type: "quote" | "invoice";
  status: "draft" | "sent" | "paid";
  total: number;
  items: InvoiceItem[];
  createdAt: string;
  sentAt: string | null;
}

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  isConnected: boolean;
  conversationMessages: ConversationMessage[];
  error: string | null;
}

export interface RealtimeMessage {
  type: string;
  event_id?: string;
  [key: string]: unknown;
}

export interface FunctionCallResult {
  name: string;
  arguments: Record<string, unknown>;
}

export type DocumentType = "quote" | "invoice";
export type DocumentStatus = "draft" | "sent" | "paid";
export type ShareMethod = "whatsapp" | "sms" | "email";
