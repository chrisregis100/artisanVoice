import { createClient } from "@/lib/supabase/server";
import { MarketingHeader, type MarketingUser } from "./_components/marketing-header";

const extractFirstName = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0] ?? null;
};

const buildMarketingUser = async (): Promise<MarketingUser | null> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("business_name")
    .eq("id", user.id)
    .maybeSingle();

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const stringMeta = (key: string) =>
    typeof meta[key] === "string" ? (meta[key] as string) : null;

  const firstName =
    extractFirstName(stringMeta("first_name")) ??
    extractFirstName(stringMeta("given_name")) ??
    extractFirstName(stringMeta("name")) ??
    extractFirstName(stringMeta("full_name")) ??
    extractFirstName(profile?.business_name ?? null) ??
    extractFirstName(stringMeta("business_name")) ??
    extractFirstName(user.email?.split("@")[0] ?? null) ??
    "";

  return {
    id: user.id,
    email: user.email ?? null,
    firstName,
  };
};

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialUser = await buildMarketingUser();

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader initialUser={initialUser} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
