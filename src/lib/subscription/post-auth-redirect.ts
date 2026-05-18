/** Where to send the user after sign-in: dashboard if they already have an active plan, else paywall. */
export async function getPostAuthPath(): Promise<string> {
  try {
    const res = await fetch("/api/subscription/status");
    if (!res.ok) return "/paywall";
    const data = (await res.json()) as { hasSubscription?: boolean };
    return data.hasSubscription ? "/dashboard" : "/paywall";
  } catch {
    return "/paywall";
  }
}
