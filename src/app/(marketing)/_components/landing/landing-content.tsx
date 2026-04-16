"use client";

import { CtaBannerSection } from "./cta-banner-section";
import { FaqSection } from "./faq-section";
import { FeaturesSection } from "./features-section";
import { FooterSection } from "./footer-section";
import { HeroSection } from "./hero-section";
import { HowItWorksSection } from "./how-it-works-section";
import { PricingSection } from "./pricing-section";
import { SocialProofSection } from "./social-proof-section";
import { TestimonialsSection } from "./testimonials-section";

export function LandingContent() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <SocialProofSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <FaqSection />
      <CtaBannerSection />
      <FooterSection />
    </div>
  );
}
