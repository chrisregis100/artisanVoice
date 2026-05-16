import crypto from "crypto";
import { env } from "@/lib/env";
import { getPack } from "@/lib/credits/packs";

interface FedaPaymentParams {
  amount: number;
  currency: string;
  email: string;
  name: string;
  userId: string;
  planId: string;
  redirectUrl: string;
}

interface FedaPayPackPurchaseParams {
  userId: string;
  packSlug: string;
  redirectUrl: string;
}

interface FedaPayTransactionResponse {
  // FedaPay v1 envelopes the resource under the key "v1/transaction" (literal slash)
  "v1/transaction": {
    id: number;
    klass: string;
    transaction_key: string;
    reference: string;
    amount: number;
    description: string;
    callback_url: string | null;
    status: string;
    customer_id: number;
    currency_id: number;
    mode: string;
    operation: string;
    created_at: string;
    updated_at: string;
    approved_at: string | null;
    canceled_at: string | null;
    declined_at: string | null;
    transferred_at: string | null;
    reversed_at: string | null;
    deleted_at: string | null;
  };
}

interface FedaPayTokenResponse {
  token: string;
  url: string;
}

interface FedaPayVerifyResponse {
  // Same "v1/transaction" envelope as the create response
  "v1/transaction": {
    id: number;
    status: string;
    amount: number;
    currency_id: number;
    reference: string;
  };
}

interface FedaPayFullTransactionResponse {
  "v1/transaction": {
    id: number;
    status: string;
    amount: number;
    currency_id: number;
    reference: string;
    metadata: {
      user_id?: string;
      plan_id?: string;
      pack_id?: string;
      pack_slug?: string;
      kind?: string;
    } | null;
  };
}

export interface FedaPayTransactionData {
  id: number;
  status: string;
  amount: number;
  reference: string;
  metadata: {
    user_id?: string;
    plan_id?: string;
    pack_id?: string;
    pack_slug?: string;
    kind?: string;
  } | null;
}

const requireFedaPaySecretKey = (): string => {
  const key = env.FEDAPAY_SECRET_KEY?.trim();
  if (!key) {
    throw new Error(
      "FedaPay n'est pas configuré : renseignez FEDAPAY_SECRET_KEY.",
    );
  }
  return key;
};

// Sandbox keys (sk_sandbox_…) must hit the sandbox endpoint; live keys hit the live endpoint.
const getFedaPayBaseUrl = (): string => {
  const key = env.FEDAPAY_SECRET_KEY?.trim() ?? "";
  return key.startsWith("sk_sandbox_")
    ? "https://sandbox-api.fedapay.com/v1"
    : "https://api.fedapay.com/v1";
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
  };

  const txResponse = await fetch(`${getFedaPayBaseUrl()}/transactions`, {
    method: "POST",
    headers,
    body: JSON.stringify(transactionPayload),
  });

  if (!txResponse.ok) {
    const errorText = await txResponse.text();
    throw new Error(`FedaPay transaction error: ${txResponse.status} — ${errorText}`);
  }

  const txData: FedaPayTransactionResponse = await txResponse.json();
  const transactionId = txData["v1/transaction"]?.id;
  if (!transactionId) {
    throw new Error(
      `FedaPay: réponse inattendue lors de la création de la transaction — clés reçues: ${Object.keys(txData).join(", ")}`,
    );
  }

  const tokenResponse = await fetch(
    `${getFedaPayBaseUrl()}/transactions/${transactionId}/token`,
    {
      method: "POST",
      headers,
    },
  );

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`FedaPay token error: ${tokenResponse.status} — ${errorText}`);
  }

  const tokenData: FedaPayTokenResponse = await tokenResponse.json();
  if (!tokenData.url) {
    throw new Error(
      `FedaPay: URL de paiement absente dans la réponse token — clés reçues: ${Object.keys(tokenData).join(", ")}`,
    );
  }

  return { paymentUrl: tokenData.url };
};

export const initiateFedaPayPackPurchase = async (
  params: FedaPayPackPurchaseParams,
): Promise<{ paymentUrl: string }> => {
  const pack = await getPack(params.packSlug);
  if (!pack) {
    throw new Error(`Credit pack introuvable : ${params.packSlug}`);
  }

  const headers = getFedaPayHeaders();

  const transactionPayload = {
    description: `Achat pack ${pack.displayName} — ${pack.creditsAmount + pack.bonusCredits} crédits Billo`,
    amount: pack.priceXof,
    currency: { iso: "XOF" },
    callback_url: params.redirectUrl,
    metadata: {
      user_id: params.userId,
      pack_id: pack.id,
      pack_slug: params.packSlug,
      kind: "credit_purchase",
    },
  };

  const txResponse = await fetch(`${getFedaPayBaseUrl()}/transactions`, {
    method: "POST",
    headers,
    body: JSON.stringify(transactionPayload),
  });

  if (!txResponse.ok) {
    const errorText = await txResponse.text();
    throw new Error(`FedaPay transaction error: ${txResponse.status} — ${errorText}`);
  }

  const txData: FedaPayTransactionResponse = await txResponse.json();
  const transactionId = txData["v1/transaction"]?.id;
  if (!transactionId) {
    throw new Error(
      `FedaPay: réponse inattendue lors de la création de la transaction — clés reçues: ${Object.keys(txData).join(", ")}`,
    );
  }

  const tokenResponse = await fetch(
    `${getFedaPayBaseUrl()}/transactions/${transactionId}/token`,
    {
      method: "POST",
      headers,
    },
  );

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`FedaPay token error: ${tokenResponse.status} — ${errorText}`);
  }

  const tokenData: FedaPayTokenResponse = await tokenResponse.json();
  if (!tokenData.url) {
    throw new Error(
      `FedaPay: URL de paiement absente dans la réponse token — clés reçues: ${Object.keys(tokenData).join(", ")}`,
    );
  }

  return { paymentUrl: tokenData.url };
};

export const verifyFedaPayPayment = async (
  transactionId: string,
  options: { minimumAmount: number },
): Promise<{ success: boolean; reference: string | null; amount: number | null }> => {
  const headers = getFedaPayHeaders();

  const response = await fetch(
    `${getFedaPayBaseUrl()}/transactions/${transactionId}`,
    {
      method: "GET",
      headers,
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`FedaPay verify error: ${response.status} — ${errorText}`);
  }

  const data: FedaPayVerifyResponse = await response.json();
  const tx = data["v1/transaction"];
  if (!tx) {
    throw new Error(
      `FedaPay: réponse inattendue lors de la vérification — clés reçues: ${Object.keys(data).join(", ")}`,
    );
  }

  const isSuccessful =
    (tx.status === "approved" || tx.status === "transferred") &&
    tx.amount >= options.minimumAmount;

  return {
    success: isSuccessful,
    reference: tx.reference,
    amount: tx.amount,
  };
};

/**
 * Fetch a FedaPay transaction with its full metadata.
 * Use this when you need the user_id / plan_id stored in the transaction metadata
 * (e.g. the payment-return fallback in the subscription verify route).
 */
export const fetchFedaPayTransaction = async (
  transactionId: string,
): Promise<FedaPayTransactionData> => {
  const headers = getFedaPayHeaders();

  const response = await fetch(
    `${getFedaPayBaseUrl()}/transactions/${transactionId}`,
    {
      method: "GET",
      headers,
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `FedaPay fetch error: ${response.status} — ${errorText}`,
    );
  }

  const data: FedaPayFullTransactionResponse = await response.json();
  const tx = data["v1/transaction"];
  if (!tx) {
    throw new Error(
      `FedaPay: réponse inattendue lors du fetch — clés reçues: ${Object.keys(data).join(", ")}`,
    );
  }

  return {
    id: tx.id,
    status: tx.status,
    amount: tx.amount,
    reference: tx.reference,
    metadata: tx.metadata ?? null,
  };
};

export const verifyFedaPayWebhookSignature = (
  payload: string,
  signature: string,
): boolean => {
  const webhookSecret = env.FEDAPAY_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) return false;

  const expectedDigest = crypto
    .createHmac("sha256", webhookSecret)
    .update(payload)
    .digest("hex");

  // Normalise: FedaPay may send a plain hex digest or a "sha256=<hex>" prefixed value.
  const receivedDigest = signature.startsWith("sha256=")
    ? signature.slice(7)
    : signature;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedDigest, "hex"),
      Buffer.from(receivedDigest, "hex"),
    );
  } catch {
    // Buffer.from throws on non-hex input — treat as invalid signature.
    return false;
  }
};
