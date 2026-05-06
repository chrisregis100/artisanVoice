"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const SettingsSchema = z.object({
  business_name: z.string().min(0).max(200).default(""),
  phone: z.string().max(50).default(""),
  business_address: z.string().max(500).default(""),
  quote_prefix: z.string().min(1).max(20).default("DV-"),
  invoice_prefix: z.string().min(1).max(20).default("FAC-"),
  vat_rate_percent: z.number().min(0).max(100).default(20),
  legal_mentions: z.string().max(2000).default(""),
  currency: z.enum(["XOF", "EUR", "USD"]).default("XOF"),
});

export type SettingsFormValues = z.infer<typeof SettingsSchema>;

export interface UpdateSettingsResult {
  success: boolean;
  error?: string;
}

export async function updateUserSettings(
  values: SettingsFormValues
): Promise<UpdateSettingsResult> {
  const parsed = SettingsSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().formErrors.join(", ") };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("users")
    .update(parsed.data)
    .eq("id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard", "layout");
  return { success: true };
}
