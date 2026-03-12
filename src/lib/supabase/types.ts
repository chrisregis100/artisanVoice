export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          business_name: string;
          phone: string;
          created_at: string;
        };
        Insert: {
          id: string;
          business_name?: string;
          phone?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_name?: string;
          phone?: string;
          created_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          phone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          phone?: string | null;
          created_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          user_id: string;
          customer_id: string | null;
          customer_name: string;
          type: "quote" | "invoice";
          status: "draft" | "sent" | "paid";
          total: number;
          created_at: string;
          sent_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          customer_id?: string | null;
          customer_name?: string;
          type?: "quote" | "invoice";
          status?: "draft" | "sent" | "paid";
          total?: number;
          created_at?: string;
          sent_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          customer_id?: string | null;
          customer_name?: string;
          type?: "quote" | "invoice";
          status?: "draft" | "sent" | "paid";
          total?: number;
          created_at?: string;
          sent_at?: string | null;
        };
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          description: string;
          quantity?: number;
          unit_price?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          description?: string;
          quantity?: number;
          unit_price?: number;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
