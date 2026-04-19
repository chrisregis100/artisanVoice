import crypto from "crypto";
import { env } from "@/lib/env";

interface FedaPaymentParams {
  amount: number;
  currency: string;
  email: string;
  name: string;
  userId: string;
  planId: string;
  redirectUrl: string;
}

interface FedaPayTransactionResponse {
  v1: {
    transaction: {
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
  };
}

interface FedaPayTokenResponse {
  token: string;
  url: string;
}

interface FedaPayVerifyResponse {
  v1: {
    transaction: {
      id: number;
      status: string;
      amount: number;
      currency_id: number;
      reference: string;
    };
  };
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

  const txData: FedaPayTransactionResponse = await txResponse.json();
  const transactionId = txData.v1.transaction.id;

  const tokenResponse = await fetch(
    `${baseUrl}/transactions/${transactionId}/token`,
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

  return { paymentUrl: tokenData.url };
};

export const verifyFedaPayPayment = async (
  transactionId: string,
  options: { minimumAmount: number },
): Promise<{ success: boolean; reference: string | null; amount: number | null }> => {
  const baseUrl = getFedaPayBaseUrl();
  const headers = getFedaPayHeaders();

  const response = await fetch(
    `${baseUrl}/transactions/${transactionId}`,
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
  const tx = data.v1.transaction;

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
