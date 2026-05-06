import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { LanguageProvider } from "@/i18n/context";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://billo.regiskiki.me"),
  title: {
    default: "Billo — Assistant vocal de facturation pour artisans",
    template: "%s | Billo",
  },
  description:
    "Billo est l'assistant vocal qui simplifie la facturation des artisans. Créez vos devis et factures en quelques secondes, sans saisie manuelle.",
  alternates: {
    canonical: "/",
    languages: {
      "fr-FR": "/",
      "x-default": "/",
    },
  },
  keywords: [
    "facturation artisan",
    "assistant vocal facturation",
    "devis artisan",
    "facture vocale",
    "logiciel facturation artisan",
    "facturation rapide",
    "gestion devis facture",
    "artisan numérique",
    "billo",
  ],
  authors: [{ name: "Billo" }],
  creator: "Billo",
  openGraph: {
    title: "Billo — Assistant vocal de facturation pour artisans",
    description:
      "Billo est l'assistant vocal qui simplifie la facturation des artisans. Créez vos devis et factures en quelques secondes, sans saisie manuelle.",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://billo.regiskiki.me",
    siteName: "Billo",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Billo — Assistant vocal de facturation pour artisans",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Billo — Assistant vocal de facturation pour artisans",
    description:
      "Billo est l'assistant vocal qui simplifie la facturation des artisans. Créez vos devis et factures en quelques secondes, sans saisie manuelle.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon-192.svg", type: "image/svg+xml" }],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Billo",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} ${plusJakarta.variable} font-sans antialiased`}>
        <LanguageProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster position="top-right" richColors />
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
