import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const EU_COUNTRIES = new Set([
  "FR", "DE", "IT", "ES", "NL", "BE", "AT", "PT", "IE", "FI",
  "GR", "LU", "MT", "SI", "SK", "EE", "LV", "LT", "CY", "HR",
]);

export async function middleware(request: NextRequest) {
  // Get the response from updateSession (handles Supabase auth cookies)
  const response = await updateSession(request);

  // Only set currency cookie if it doesn't already exist
  const existingCurrency = request.cookies.get("user-currency")?.value;
  if (!existingCurrency) {
    // Detect country from Vercel IP geolocation header
    const country = request.headers.get("x-vercel-ip-country") ?? "CI";

    // Map country to currency
    let currency: string;
    if (country === "US") {
      currency = "USD";
    } else if (EU_COUNTRIES.has(country)) {
      currency = "EUR";
    } else {
      currency = "XOF"; // Default for African francophone audience
    }

    // Set currency cookie on the response
    response.cookies.set("user-currency", currency, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)",
  ],
};
