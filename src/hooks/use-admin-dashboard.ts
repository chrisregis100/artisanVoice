"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export interface Plan {
  id: string;
  name: string;
  display_name: string;
  price_amount: number;
  invoice_limit: number | null;
  is_active: boolean;
}

export interface AdminSetting {
  key: string;
  value: unknown;
}

export interface Stats {
  totalUsers: number;
  totalInvoices: number;
  freeSubscriptions: number;
  proSubscriptions: number;
  monthlyRevenue: number;
}

export interface ServerKeyInfo {
  source: "database" | "environment" | "none";
  mask: string;
}

export interface AdminData {
  settings: AdminSetting[];
  plans: Plan[];
  stats: Stats;
  serverKeys: {
    openai: ServerKeyInfo;
    gemini: ServerKeyInfo;
    afri?: ServerKeyInfo;
  };
}

export function useAdminDashboard() {
  const [data, setData] = useState<AdminData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Erreur lors du chargement");
      const json = (await res.json()) as AdminData;
      setData(json);
    } catch (err) {
      toast.error("Erreur", {
        description:
          err instanceof Error ? err.message : "Impossible de charger les données",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { data, isLoading, refetch: fetchData };
}
