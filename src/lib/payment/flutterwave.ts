import crypto from "crypto";
import { env } from "@/lib/env";

interface FlutterwavePaymentParams {
  amount: number;
  currency: string;
  email: string;
  name: string;
  userId: string;
  planId: string;
  redirectUrl: string;
}

interface FlutterwavePaymentResponse {
  status: string;
  message: string;
  data?: {
    link: string;
  };
}

interface FlutterwaveVerifyResponse {
  status: string;
  message: string;
  data?: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    device_fingerprint: string;
    amount: number;
    currency: string;
    charged_amount: number;
    app_fee: number;
    merchant_fee: number;
    processor_response: string;
    auth_model: string;
    ip: string;
    narration: string;
    status: string;
    payment_type: string;
    created_at: string;
    account_id: number;
    customer: {
      id: number;
      name: string;
      phone_number: string | null;
      email: string;
      created_at: string;
    };
  };
}

export const initiateFlutterwavePayment = async (
  params: FlutterwavePaymentParams,
): Promise<{ paymentUrl: string }> => {
  const secretKey = env.FLUTTERWAVE_SECRET_KEY;

  const txRef = `billo-${params.userId}-${params.planId}-${Date.now()}`;

  const payload = {
    tx_ref: txRef,
    amount: params.amount,
    currency: params.currency,
    redirect_url: params.redirectUrl,
    meta: {
      user_id: params.userId,
      plan_id: params.planId,
    },
    customer: {
      email: params.email,
      name: params.name,
    },
    customizations: {
      title: "Billo Pro",
      description: "Abonnement mensuel Plan Pro — 5 000 FCFA/mois",
      logo: "https://billo.app/billo-mark.svg",
    },
  };

  const response = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Flutterwave API error: ${response.status} — ${errorText}`);
  }

  const data: FlutterwavePaymentResponse = await response.json();

  if (data.status !== "success" || !data.data?.link) {
    throw new Error(
      `Flutterwave payment initiation failed: ${data.message}`,
    );
  }

  return { paymentUrl: data.data.link };
};

export const verifyFlutterwavePayment = async (
  transactionId: string,
): Promise<{ success: boolean; txRef: string | null; amount: number | null }> => {
  const secretKey = env.FLUTTERWAVE_SECRET_KEY;

  const response = await fetch(
    `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Flutterwave verify error: ${response.status} — ${errorText}`);
  }

  const data: FlutterwaveVerifyResponse = await response.json();

  if (data.status !== "success" || !data.data) {
    return { success: false, txRef: null, amount: null };
  }

  const isSuccessful =
    data.data.status === "successful" &&
    data.data.currency === "XOF" &&
    data.data.amount >= 5000;

  return {
    success: isSuccessful,
    txRef: data.data.tx_ref,
    amount: data.data.amount,
  };
};

export const verifyFlutterwaveWebhookHash = (
  _payload: string,
  signature: string,
): boolean => {
  const webhookSecret = env.FLUTTERWAVE_WEBHOOK_SECRET;

  const a = Buffer.from(signature);
  const b = Buffer.from(webhookSecret);
  if (a.length !== b.length) return false;

  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
};
