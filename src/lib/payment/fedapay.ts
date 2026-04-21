import { env } from "@/lib/env";
import crypto from "crypto";

interface FedaPaymentParams {
  amount: number;
  currency: string;
  email: string;
  name: string;
  userId: string;
  planId: string;
  redirectUrl: string;
}

/** POST /transactions returns nested `v1/transaction` (slash key) with payment_url. */
function parseCreatedTransaction(txData: unknown): {
  id: number;
  paymentUrl: string | null;
} | null {
  if (!txData || typeof txData !== "object") return null;
  const root = txData as Record<string, unknown>;
  const node =
    root["v1/transaction"] ??
    (root.v1 as Record<string, unknown> | undefined)?.transaction;
  if (node && typeof node === "object") {
    const t = node as Record<string, unknown>;
    const id = typeof t.id === "number" ? t.id : Number(t.id);
    if (!Number.isFinite(id)) return null;
    const paymentUrl =
      typeof t.payment_url === "string" && t.payment_url.length > 0
        ? t.payment_url
        : null;
    return { id, paymentUrl };
  }
  const id = typeof root.id === "number" ? root.id : Number(root.id);
  if (!Number.isFinite(id)) return null;
  const paymentUrl =
    typeof root.payment_url === "string" && root.payment_url.length > 0
      ? root.payment_url
      : null;
  return { id, paymentUrl };
}

interface FedaPayTokenResponse {
  token: string;
  url: string;
}

export interface FedaPayTransactionRecord {
  id: number;
  status: string;
  amount: number;
  reference: string;
  metadata: { user_id?: string; plan_id?: string } | null;
  /** Email du client sur la transaction (GET API), pour repli si metadata absente. */
  customerEmail: string | null;
}

function coerceMetaString(value: unknown): string | undefined {
  if (typeof value === "string" && value.length > 0) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

function parseMetadataFromTransactionNode(
  t: Record<string, unknown>,
): { user_id?: string; plan_id?: string } | null {
  const raw = t.metadata;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const m = raw as Record<string, unknown>;
  const user_id = coerceMetaString(
    m.user_id ?? m.userId ?? m["user-id"],
  );
  const plan_id = coerceMetaString(
    m.plan_id ?? m.planId ?? m["plan-id"],
  );
  if (!user_id && !plan_id) return null;
  return { user_id, plan_id };
}

function parseCustomerEmailFromTransactionNode(
  t: Record<string, unknown>,
): string | null {
  const c = t.customer;
  if (!c || typeof c !== "object" || Array.isArray(c)) return null;
  const email = (c as Record<string, unknown>).email;
  if (typeof email !== "string" || !email.includes("@")) return null;
  return email.trim().toLowerCase();
}

function parseTransactionFromApiPayload(data: unknown): FedaPayTransactionRecord | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;
  const node =
    root["v1/transaction"] ??
    (root.v1 as Record<string, unknown> | undefined)?.transaction;
  if (!node || typeof node !== "object") return null;
  const t = node as Record<string, unknown>;
  const id = typeof t.id === "number" ? t.id : Number(t.id);
  if (!Number.isFinite(id)) return null;
  const status = typeof t.status === "string" ? t.status : "";
  const amount = typeof t.amount === "number" ? t.amount : Number(t.amount);
  const reference = typeof t.reference === "string" ? t.reference : "";
  if (!Number.isFinite(amount) || !reference) return null;

  const metadata = parseMetadataFromTransactionNode(t);
  const customerEmail = parseCustomerEmailFromTransactionNode(t);

  return { id, status, amount, reference, metadata, customerEmail };
}

const getFedaPayBaseUrl = (): string => {
  if (env.FEDAPAY_ENVIRONMENT === "sandbox") {
    return "https://sandbox-api.fedapay.com/v1";
  }
  return "https://api.fedapay.com/v1";
};

const requireFedaPaySecretKey = (): string => {
  const key = env.FEDAPAY_SECRET_KEY?.trim();
  if (!key) {
    throw new Error(
      "FedaPay n'est pas configuré : renseignez FEDAPAY_SECRET_KEY.",
    );
  }
  return key;
};

const getFedaPayHeaders = (): HeadersInit => {
  return {
    Authorization: `Bearer ${requireFedaPaySecretKey()}`,
    "Content-Type": "application/json",
    "FedaPay-Version": "2018-02-01",
  };
};

export const initiateFedaPayPayment = async (
  params: FedaPaymentParams,
): Promise<{ paymentUrl: string }> => {
  const baseUrl = getFedaPayBaseUrl();
  const headers = getFedaPayHeaders();

  const [firstName, ...lastParts] = params.name.split(" ");
  const lastName = lastParts.join(" ") || firstName;

  const transactionPayload = {
    description: `Abonnement Billo Pro — ${params.amount.toLocaleString("fr-FR")} ${params.currency}/mois`,
    amount: params.amount,
    currency: { iso: params.currency },
    callback_url: params.redirectUrl,
    metadata: {
      user_id: params.userId,
      plan_id: params.planId,
    },
    customer: {
      email: params.email,
      firstname: firstName,
      lastname: lastName,
    },
    mode: "mtn_open",
  };

  const txResponse = await fetch(`${baseUrl}/transactions`, {
    method: "POST",
    headers,
    body: JSON.stringify(transactionPayload),
  });

  if (!txResponse.ok) {
    const errorText = await txResponse.text();
    const authHint =
      txResponse.status === 401
        ? " (clé test sur l’API live ? définissez FEDAPAY_ENVIRONMENT=sandbox, ou utilisez une clé live.)"
        : "";
    throw new Error(
      `FedaPay transaction error: ${txResponse.status} — ${errorText}${authHint}`,
    );
  }

  const txData = await txResponse.json();
  const created = parseCreatedTransaction(txData);
  if (!created) {
    throw new Error("FedaPay: réponse de création de transaction invalide.");
  }

  if (created.paymentUrl) {
    return { paymentUrl: created.paymentUrl };
  }

  const tokenResponse = await fetch(
    `${baseUrl}/transactions/${created.id}/token`,
    {
      method: "POST",
      headers,
    },
  );

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(
      `FedaPay token error: ${tokenResponse.status} — ${errorText}`,
    );
  }

  const tokenData: FedaPayTokenResponse = await tokenResponse.json();

  return { paymentUrl: tokenData.url };
};

export const getFedaPayTransaction = async (
  transactionId: string,
): Promise<FedaPayTransactionRecord> => {
  const baseUrl = getFedaPayBaseUrl();
  const headers = getFedaPayHeaders();

  const response = await fetch(`${baseUrl}/transactions/${transactionId}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`FedaPay verify error: ${response.status} — ${errorText}`);
  }

  const data: unknown = await response.json();
  const tx = parseTransactionFromApiPayload(data);
  if (!tx) {
    throw new Error("FedaPay: réponse transaction invalide.");
  }
  return tx;
};

export const verifyFedaPayPayment = async (
  transactionId: string,
  options: { minimumAmount: number },
): Promise<{
  success: boolean;
  reference: string | null;
  amount: number | null;
}> => {
  const tx = await getFedaPayTransaction(transactionId);

  const isSuccessful =
    tx.status === "approved" && tx.amount >= options.minimumAmount;

  return {
    success: isSuccessful,
    reference: tx.reference,
    amount: tx.amount,
  };
};

export const verifyFedaPayWebhookSignature = (
  payload: string,
  signature: string,
): boolean => {
  const webhookSecret = env.FEDAPAY_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) return false;

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(payload)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(signature, "hex"),
    );
  } catch {
    return false;
  }
};
