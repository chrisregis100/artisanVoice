"use client";

import Link from "next/link";
import {
  Mic,
  FileText,
  Share2,
  WifiOff,
  CheckCircle2,
  ArrowRight,
  Star,
  Zap,
  Users,
  TrendingUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/context";

export function LandingContent() {
  const { t } = useLanguage();

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

function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-white border-b border-slate-100 pt-32 pb-20 md:pb-32">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-16">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left lg:w-1/2">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-700">
              <Zap className="h-3.5 w-3.5" aria-hidden />
              {t("landing.hero.badge")}
            </span>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              {t("landing.hero.titlePart1")}{" "}
              <span className="text-emerald-600">
                {t("landing.hero.titleHighlight")}
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-500">
              {t("landing.hero.subtitle")}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 gap-2 rounded-xl bg-emerald-600 px-8 text-base font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                <Link href="/register">
                  {t("landing.hero.ctaPrimary")}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 rounded-xl border border-slate-300 px-8 text-base font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Link href="#demo">{t("landing.hero.ctaSecondary")}</Link>
              </Button>
            </div>

            <p className="mt-4 text-sm text-slate-400">
              {t("landing.hero.freeNotice")}
            </p>
          </div>

          <div className="relative w-full lg:w-1/2">
            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute -top-4 -right-4 z-10 flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                  <Mic className="h-4 w-4 text-slate-700" aria-hidden />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    {t("landing.hero.dictating")}
                  </p>
                  <p className="text-xs text-slate-500">
                    &ldquo;Prestation peinture 45 000 F&rdquo;
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100">
                <div className="flex items-center justify-between bg-slate-900 px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
                      <Mic className="h-3.5 w-3.5 text-white" aria-hidden />
                    </div>
                    <span className="text-sm font-semibold text-white">
                      ArtisanVoice
                    </span>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                    {t("landing.hero.connected")}
                  </span>
                </div>

                <div className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        FACTURE
                      </p>
                      <p className="text-lg font-bold text-slate-800">
                        FAC-2024-017
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {t("landing.hero.draft")}
                    </span>
                  </div>

                  <div className="mb-4 rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-medium text-slate-500">
                      {t("landing.hero.client")}
                    </p>
                    <p className="text-sm font-semibold text-slate-800">
                      Mamadou Diallo
                    </p>
                    <p className="text-xs text-slate-500">+221 77 000 00 00</p>
                  </div>

                  <div className="space-y-2">
                    {[
                      { label: "Peinture façade", qty: 1, price: "45 000 F" },
                      { label: "Main d'œuvre", qty: 2, price: "20 000 F" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-700">
                            {item.label}
                          </p>
                          <p className="text-xs text-slate-400">
                            {t("landing.hero.qty")} : {item.qty}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-slate-800">
                          {item.price}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3">
                    <span className="text-sm font-medium text-white/80">
                      {t("landing.hero.totalTTC")}
                    </span>
                    <span className="text-lg font-extrabold text-white">
                      85 000 FCFA
                    </span>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 z-10 flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-lg">
                <Share2 className="h-4 w-4 text-emerald-600" aria-hidden />
                <span className="text-xs font-semibold text-slate-800">
                  {t("landing.hero.sharedWhatsApp")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialProofSection() {
  const { t } = useLanguage();

  const stats = [
    { value: "1 200+", label: t("landing.socialProof.activeArtisans") },
    { value: "18 000+", label: t("landing.socialProof.docsCreated") },
    { value: "< 30 s", label: t("landing.socialProof.perInvoice") },
    { value: "4.8 / 5", label: t("landing.socialProof.avgRating") },
  ];

  return (
    <section
      id="social-proof"
      className="border-b border-slate-100 bg-white py-12"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="mb-10 text-center text-sm font-semibold uppercase tracking-widest text-slate-400">
          {t("landing.socialProof.trust")}
        </p>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1">
              <span className="text-3xl font-extrabold text-slate-900">
                {stat.value}
              </span>
              <span className="text-sm text-slate-500">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const { t } = useLanguage();

  const features = [
    {
      icon: Mic,
      title: t("landing.features.voiceTitle"),
      description: t("landing.features.voiceDesc"),
      span: "col-span-1 md:col-span-2",
    },
    {
      icon: FileText,
      title: t("landing.features.pdfTitle"),
      description: t("landing.features.pdfDesc"),
      span: "col-span-1",
    },
    {
      icon: Share2,
      title: t("landing.features.whatsappTitle"),
      description: t("landing.features.whatsappDesc"),
      span: "col-span-1",
    },
    {
      icon: WifiOff,
      title: t("landing.features.offlineTitle"),
      description: t("landing.features.offlineDesc"),
      span: "col-span-1",
    },
    {
      icon: Users,
      title: t("landing.features.clientsTitle"),
      description: t("landing.features.clientsDesc"),
      span: "col-span-1 md:col-span-2",
    },
    {
      icon: TrendingUp,
      title: t("landing.features.trackingTitle"),
      description: t("landing.features.trackingDesc"),
      span: "col-span-1 md:col-span-3",
    },
  ];

  return (
    <section id="features" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-16 text-center">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-4 py-1.5 text-sm font-semibold text-slate-700">
            {t("landing.features.badge")}
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {t("landing.features.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
            {t("landing.features.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-8 hover:shadow-md transition-shadow ${feature.span}`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <feature.icon className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const { t } = useLanguage();

  const steps = [
    {
      step: "01",
      title: t("landing.howItWorks.step1Title"),
      description: t("landing.howItWorks.step1Desc"),
    },
    {
      step: "02",
      title: t("landing.howItWorks.step2Title"),
      description: t("landing.howItWorks.step2Desc"),
    },
    {
      step: "03",
      title: t("landing.howItWorks.step3Title"),
      description: t("landing.howItWorks.step3Desc"),
    },
    {
      step: "04",
      title: t("landing.howItWorks.step4Title"),
      description: t("landing.howItWorks.step4Desc"),
    },
  ];

  return (
    <section id="demo" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-16 text-center">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-4 py-1.5 text-sm font-semibold text-slate-700">
            {t("landing.howItWorks.badge")}
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {t("landing.howItWorks.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
            {t("landing.howItWorks.subtitle")}
          </p>
        </div>

        <div className="relative">
          <div
            className="absolute top-8 left-0 right-0 hidden h-0 border-t-2 border-dashed border-slate-200 lg:block"
            aria-hidden
          />

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div
                key={step.step}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-2xl font-black text-white shadow-lg">
                  {step.step}
                  {index < steps.length - 1 && (
                    <div
                      className="absolute -right-4 top-1/2 hidden -translate-y-1/2 text-slate-300 lg:block"
                      aria-hidden
                    >
                      →
                    </div>
                  )}
                </div>
                <h3 className="mb-2 text-base font-bold text-slate-800">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-500">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex justify-center">
          <Button
            asChild
            size="lg"
            className="h-12 gap-2 rounded-xl bg-slate-900 px-8 text-base font-semibold text-white shadow-md hover:bg-slate-800"
          >
            <Link href="/register">
              {t("landing.howItWorks.cta")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const { t } = useLanguage();

  const testimonials = [
    {
      name: t("landing.testimonials.t1Name"),
      role: t("landing.testimonials.t1Role"),
      avatar: "IK",
      rating: 5,
      quote: t("landing.testimonials.t1Quote"),
    },
    {
      name: t("landing.testimonials.t2Name"),
      role: t("landing.testimonials.t2Role"),
      avatar: "FT",
      rating: 5,
      quote: t("landing.testimonials.t2Quote"),
    },
    {
      name: t("landing.testimonials.t3Name"),
      role: t("landing.testimonials.t3Role"),
      avatar: "KA",
      rating: 5,
      quote: t("landing.testimonials.t3Quote"),
    },
  ];

  return (
    <section
      id="testimonials"
      className="bg-slate-950 py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-16 text-center">
          <span className="mb-3 inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-slate-400">
            {t("landing.testimonials.badge")}
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {t("landing.testimonials.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
            {t("landing.testimonials.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6"
            >
              <div className="flex items-center gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                    aria-hidden
                  />
                ))}
              </div>
              <p className="flex-1 text-sm leading-relaxed text-slate-300">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3 border-t border-slate-800 pt-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-slate-400">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const { t } = useLanguage();

  const plans = [
    {
      name: t("landing.pricing.freeName"),
      price: "0",
      period: t("landing.pricing.freePeriod"),
      description: t("landing.pricing.freeDesc"),
      cta: t("landing.pricing.freeCta"),
      ctaHref: "/register",
      featured: false,
      features: [
        t("landing.pricing.freeF1"),
        t("landing.pricing.freeF2"),
        t("landing.pricing.freeF3"),
        t("landing.pricing.freeF4"),
        t("landing.pricing.freeF5"),
        t("landing.pricing.freeF6"),
      ],
      missing: [
        t("landing.pricing.missingF1"),
        t("landing.pricing.missingF2"),
        t("landing.pricing.missingF3"),
      ],
    },
    {
      name: t("landing.pricing.proName"),
      price: "5 000",
      period: t("landing.pricing.proPeriod"),
      description: t("landing.pricing.proDesc"),
      cta: t("landing.pricing.proCta"),
      ctaHref: "/register?plan=pro",
      featured: true,
      features: [
        t("landing.pricing.proF1"),
        t("landing.pricing.proF2"),
        t("landing.pricing.proF3"),
        t("landing.pricing.proF4"),
        t("landing.pricing.proF5"),
        t("landing.pricing.proF6"),
        t("landing.pricing.proF7"),
        t("landing.pricing.proF8"),
      ],
      missing: [],
    },
  ];

  return (
    <section id="pricing" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-16 text-center">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-4 py-1.5 text-sm font-semibold text-slate-700">
            {t("landing.pricing.badge")}
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {t("landing.pricing.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-500">
            {t("landing.pricing.subtitle")}
          </p>
        </div>

        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl p-8 ${
                plan.featured
                  ? "bg-slate-900 text-white shadow-xl"
                  : "border border-slate-200 bg-white"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-emerald-600 px-4 py-1 text-xs font-bold text-white">
                    {t("common.recommended")}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3
                  className={`text-xl font-bold ${plan.featured ? "text-white" : "text-slate-800"}`}
                >
                  {plan.name}
                </h3>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span
                    className={`text-4xl font-black ${plan.featured ? "text-white" : "text-slate-900"}`}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={`text-sm font-medium ${plan.featured ? "text-white/70" : "text-slate-500"}`}
                  >
                    {plan.period}
                  </span>
                </div>
                <p
                  className={`mt-2 text-sm ${plan.featured ? "text-white/70" : "text-slate-500"}`}
                >
                  {plan.description}
                </p>
              </div>

              <ul className="mb-8 flex flex-col gap-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <CheckCircle2
                      className={`h-4 w-4 shrink-0 ${plan.featured ? "text-emerald-400" : "text-emerald-500"}`}
                      aria-hidden
                    />
                    <span
                      className={`text-sm ${plan.featured ? "text-white/90" : "text-slate-700"}`}
                    >
                      {f}
                    </span>
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 opacity-40">
                    <div className="h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />
                    <span className="text-sm text-slate-500">{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                size="lg"
                className={`mt-auto h-11 w-full rounded-xl font-semibold ${
                  plan.featured
                    ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                    : "border border-slate-900 bg-transparent text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Link href={plan.ctaHref}>{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-400">
          {t("landing.pricing.footer")}
        </p>
      </div>
    </section>
  );
}

function FaqSection() {
  const { t } = useLanguage();

  const faqs = [
    { question: t("landing.faq.q1"), answer: t("landing.faq.a1") },
    { question: t("landing.faq.q2"), answer: t("landing.faq.a2") },
    { question: t("landing.faq.q3"), answer: t("landing.faq.a3") },
    { question: t("landing.faq.q4"), answer: t("landing.faq.a4") },
    { question: t("landing.faq.q5"), answer: t("landing.faq.a5") },
    { question: t("landing.faq.q6"), answer: t("landing.faq.a6") },
  ];

  return (
    <section id="faq" className="bg-white py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-16 text-center">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-4 py-1.5 text-sm font-semibold text-slate-700">
            {t("landing.faq.badge")}
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {t("landing.faq.title")}
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-xl border border-slate-200 bg-slate-50 open:bg-white open:shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium text-slate-800 transition-colors hover:text-slate-900">
                {faq.question}
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <div className="px-5 pb-4 text-sm leading-relaxed text-slate-600">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBannerSection() {
  const { t } = useLanguage();

  return (
    <section className="bg-slate-950 py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <div className="mb-5 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <Mic className="h-7 w-7 text-white" aria-hidden />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          {t("landing.cta.title")}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
          {t("landing.cta.subtitle")}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            asChild
            size="lg"
            className="h-12 gap-2 rounded-xl bg-white px-8 text-base font-semibold text-slate-900 shadow-lg hover:bg-slate-100"
          >
            <Link href="/register">
              {t("landing.cta.createAccount")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 rounded-xl border-white/20 bg-transparent px-8 text-base font-semibold text-white hover:bg-white/10"
          >
            <Link href="/login">{t("landing.cta.login")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function FooterSection() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  const links = {
    [t("landing.footer.product")]: [
      { label: t("landing.footer.features"), href: "/#features" },
      { label: t("landing.footer.pricing"), href: "/#pricing" },
      { label: t("landing.footer.faq"), href: "/#faq" },
    ],
    [t("landing.footer.account")]: [
      { label: t("landing.footer.login"), href: "/login" },
      { label: t("landing.footer.register"), href: "/register" },
    ],
    [t("landing.footer.legal")]: [
      { label: t("landing.footer.legalNotice"), href: "/legal" },
      { label: t("landing.footer.privacy"), href: "/privacy" },
    ],
  };

  return (
    <footer className="border-t border-slate-100 bg-white py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              className="flex items-center gap-2.5"
              aria-label="ArtisanVoice"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900">
                <Mic className="h-4 w-4 text-white" aria-hidden />
              </div>
              <span className="text-lg font-bold text-slate-900">
                ArtisanVoice
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-500">
              {t("landing.footer.tagline")}
            </p>
          </div>

          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
                {category}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-slate-500 transition-colors hover:text-slate-900"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 sm:flex-row">
          <p className="text-sm text-slate-400">
            © {currentYear} ArtisanVoice · {t("landing.footer.rights")}
          </p>
          <p className="text-xs text-slate-300">{t("landing.footer.madeWith")}</p>
        </div>
      </div>
    </footer>
  );
}
