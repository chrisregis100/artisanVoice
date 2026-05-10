"use client";

import dynamic from "next/dynamic";
import { HeroSection } from "./hero-section";

// Dynamic imports for below-the-fold sections to improve initial page load
const FeaturesSection = dynamic(
  () =>
    import("./features-section").then((mod) => ({
      default: mod.FeaturesSection,
    })),
  {
    loading: () => <div className="h-[600px] bg-background" />,
  },
);

const HowItWorksSection = dynamic(
  () =>
    import("./how-it-works-section").then((mod) => ({
      default: mod.HowItWorksSection,
    })),
  {
    loading: () => <div className="h-[500px] bg-background" />,
  },
);

const TestimonialsSection = dynamic(
  () =>
    import("./testimonials-section").then((mod) => ({
      default: mod.TestimonialsSection,
    })),
  {
    loading: () => <div className="h-[500px] bg-brand" />,
  },
);

const PricingSection = dynamic(
  () =>
    import("./pricing-section").then((mod) => ({
      default: mod.PricingSection,
    })),
  {
    loading: () => <div className="h-[800px] bg-background" />,
  },
);

const FaqSection = dynamic(
  () => import("./faq-section").then((mod) => ({ default: mod.FaqSection })),
  {
    loading: () => <div className="h-[600px] bg-background" />,
  },
);

const CtaBannerSection = dynamic(
  () =>
    import("./cta-banner-section").then((mod) => ({
      default: mod.CtaBannerSection,
    })),
  {
    loading: () => <div className="h-[400px] bg-brand" />,
  },
);

const FooterSection = dynamic(
  () =>
    import("./footer-section").then((mod) => ({ default: mod.FooterSection })),
  {
    loading: () => <div className="h-[300px] bg-background" />,
  },
);

export function LandingContent() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      {/* <SocialProofSection /> */}
      <FeaturesSection />
      <HowItWorksSection />
      {/* <TestimonialsSection /> */}
      {/* <PricingSection /> */}
      {/* <FaqSection /> */}
      <CtaBannerSection />
      <FooterSection />
    </div>
  );
}
