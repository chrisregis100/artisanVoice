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
      plans: {
        Row: {
          id: string;
          name: string;
          display_name: string;
          price_amount: number;
          currency: string;
          invoice_limit: number | null;
          features: Json;
          is_active: boolean;
          created_at: string;
          interval: string | null;
          tier: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          display_name: string;
          price_amount?: number;
          currency?: string;
          invoice_limit?: number | null;
          features?: Json;
          is_active?: boolean;
          created_at?: string;
          interval?: string | null;
          tier?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          display_name?: string;
          price_amount?: number;
          currency?: string;
          invoice_limit?: number | null;
          features?: Json;
          is_active?: boolean;
          created_at?: string;
          interval?: string | null;
          tier?: string | null;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          status: string;
          payment_provider: string | null;
          payment_reference: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          status?: string;
          payment_provider?: string | null;
          payment_reference?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string;
          status?: string;
          payment_provider?: string | null;
          payment_reference?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
        ];
      };
      admin_settings: {
        Row: {
          key: string;
          value: Json;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      invoice_usage: {
        Row: {
          id: string;
          user_id: string;
          month_year: string;
          invoice_count: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          month_year: string;
          invoice_count?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          month_year?: string;
          invoice_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_usage_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      invoice_usage_documents: {
        Row: {
          id: string;
          user_id: string;
          month_year: string;
          document_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          month_year: string;
          document_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          month_year?: string;
          document_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_usage_documents_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          id: string;
          business_name: string;
          phone: string;
          business_address: string;
          quote_prefix: string;
          invoice_prefix: string;
          vat_rate_percent: number;
          legal_mentions: string;
          currency: string;
          created_at: string;
        };
        Insert: {
          id: string;
          business_name?: string;
          phone?: string;
          business_address?: string;
          quote_prefix?: string;
          invoice_prefix?: string;
          vat_rate_percent?: number;
          legal_mentions?: string;
          currency?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_name?: string;
          phone?: string;
          business_address?: string;
          quote_prefix?: string;
          invoice_prefix?: string;
          vat_rate_percent?: number;
          legal_mentions?: string;
          currency?: string;
          created_at?: string;
        };
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "customers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "invoices_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      credit_wallets: {
        Row: {
          user_id: string;
          balance: number;
          signup_bonus_granted: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          balance?: number;
          signup_bonus_granted?: boolean;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          balance?: number;
          signup_bonus_granted?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          kind: string;
          delta: number;
          balance_after: number;
          pack_id: string | null;
          payment_provider: string | null;
          payment_reference: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind: string;
          delta: number;
          balance_after: number;
          pack_id?: string | null;
          payment_provider?: string | null;
          payment_reference?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          kind?: string;
          delta?: number;
          balance_after?: number;
          pack_id?: string | null;
          payment_provider?: string | null;
          payment_reference?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      credit_packs: {
        Row: {
          id: string;
          slug: string;
          display_name: string;
          credits_amount: number;
          bonus_credits: number;
          price_usd_cents: number;
          price_xof: number;
          is_active: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          slug: string;
          display_name: string;
          credits_amount: number;
          bonus_credits?: number;
          price_usd_cents: number;
          price_xof: number;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: {
          id?: string;
          slug?: string;
          display_name?: string;
          credits_amount?: number;
          bonus_credits?: number;
          price_usd_cents?: number;
          price_xof?: number;
          is_active?: boolean;
          sort_order?: number;
        };
        Relationships: [];
      };
      invoice_charges: {
        Row: {
          id: string;
          user_id: string;
          document_id: string;
          transaction_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_id: string;
          transaction_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_id?: string;
          transaction_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      debit_credit: {
        Args: {
          p_user_id: string;
          p_document_id: string;
        };
        Returns: string;
      };
      grant_credits: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_kind: string;
          p_pack_id: string | null;
          p_payment_provider: string | null;
          p_payment_reference: string | null;
          p_metadata: Json | null;
        };
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
