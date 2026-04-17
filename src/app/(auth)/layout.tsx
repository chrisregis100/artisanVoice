import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s — ArtisanVoice",
    default: "ArtisanVoice",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
