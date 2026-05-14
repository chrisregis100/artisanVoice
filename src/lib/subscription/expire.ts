/**
 * @deprecated Credits never expire — these functions are no-ops in the credit model.
 */

export async function downgradeExpiredProIfNeeded(
  _supabase: unknown,
  _userId: string,
): Promise<boolean> {
  return false;
}

export async function downgradeProToFree(
  _supabase: unknown,
  _userId: string,
): Promise<{ ok: boolean; error?: string }> {
  return { ok: false, error: "not_pro" };
}
