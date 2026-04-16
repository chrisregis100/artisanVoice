/** Where to send the user after sign-in: dashboard if they already have an active plan, else plan selection. */
export async function getPostAuthPath(): Promise<string> {
  try {
    const res = await fetch("/api/subscription/status");
    if (!res.ok) return "/subscribe";
    const data = (await res.json()) as { hasSubscription?: boolean };
    return data.hasSubscription ? "/dashboard" : "/subscribe";
  } catch {
    return "/subscribe";
  }
}
