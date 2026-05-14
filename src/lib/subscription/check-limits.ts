import { precheckCharge, commitCharge } from "@/lib/credits/charge";
import { getBalance } from "@/lib/credits/wallet";

export interface UserSubscription {
  id: string;
  planName: string;
  planDisplayName: string;
  invoiceLimit: number | null;
  status: string;
  currentPeriodEnd: string | null;
}

export interface InvoiceLimitCheck {
  allowed: boolean;
  remaining: number | null;
  plan: string;
}

export const getUserSubscription = async (
  _userId: string,
): Promise<UserSubscription | null> => {
  return null;
};

/**
 * @deprecated Use {@link getBalance} from '@/lib/credits/wallet' and check `balance > 0` directly.
 */
export const canCreateInvoice = async (
  userId: string,
): Promise<InvoiceLimitCheck> => {
  const balance = await getBalance(userId);
  return {
    allowed: balance > 0,
    remaining: balance,
    plan: "credits",
  };
};

/**
 * @deprecated Credits are debited via {@link commitCharge} from '@/lib/credits/charge'.
 * This function is a no-op in the credit model.
 */
export const incrementInvoiceCount = async (_userId: string): Promise<void> => {
  // no-op — usage tracking replaced by credit debit
};

export interface PrecheckDocumentExportResult {
  canExport: boolean;
  duplicate?: boolean;
  reason?: "no_subscription" | "quota_exceeded";
}

/**
 * @deprecated Use {@link precheckCharge} from '@/lib/credits/charge' instead.
 */
export const precheckDocumentExport = async (
  userId: string,
  documentId: string,
): Promise<PrecheckDocumentExportResult> => {
  const result = await precheckCharge(userId, documentId);

  if (!result.canCharge && !result.duplicate) {
    return { canExport: false, reason: "quota_exceeded" };
  }

  return { canExport: true, duplicate: result.duplicate };
};

/**
 * @deprecated Use {@link commitCharge} from '@/lib/credits/charge' instead.
 */
export const commitDocumentExport = async (
  userId: string,
  documentId: string,
): Promise<"counted" | "duplicate" | "quota_exceeded"> => {
  const result = await commitCharge(userId, documentId);

  if (result === "charged") return "counted";
  if (result === "duplicate") return "duplicate";
  return "quota_exceeded";
};
