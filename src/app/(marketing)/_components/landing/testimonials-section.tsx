"use client";

import { useLanguage } from "@/i18n/context";
import { Star, Quote } from "lucide-react";

export function TestimonialsSection() {
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
    // Add a few more or duplicate the existing ones to ensure the marquee is long enough
    {
      name: t("landing.testimonials.t1Name") + " (Pro)",
      role: t("landing.testimonials.t1Role"),
      avatar: "IK",
      rating: 5,
      quote: t("landing.testimonials.t1Quote"),
    },
    {
      name: t("landing.testimonials.t2Name") + " (Pro)",
      role: t("landing.testimonials.t2Role"),
      avatar: "FT",
      rating: 5,
      quote: t("landing.testimonials.t2Quote"),
    },
  ];

  return (
    <section id="testimonials" className="relative overflow-hidden bg-slate-950 py-24">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950/0 to-slate-950/0 pointer-events-none"></div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        <div className="mb-16 text-center">
          <span className="mb-3 inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-semibold text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            {t("landing.testimonials.badge")}
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {t("landing.testimonials.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
            {t("landing.testimonials.subtitle")}
          </p>
        </div>
      </div>

      {/* Marquee Container */}
      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden mt-8">
        <div className="group flex overflow-hidden p-2 [--gap:1.5rem] gap-[var(--gap)]">
          <div className="flex shrink-0 justify-around gap-[var(--gap)] animate-marquee flex-row group-hover:[animation-play-state:paused]">
            {testimonials.map((testimonial, i) => (
              <TestimonialCard key={`t-${i}`} testimonial={testimonial} />
            ))}
          </div>
          <div
            aria-hidden="true"
            className="flex shrink-0 justify-around gap-[var(--gap)] animate-marquee flex-row group-hover:[animation-play-state:paused]"
          >
            {testimonials.map((testimonial, i) => (
              <TestimonialCard key={`t-dup-${i}`} testimonial={testimonial} />
            ))}
          </div>
        </div>

        {/* Gradient Masks for smooth fade out at the edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 sm:w-1/4 bg-gradient-to-r from-slate-950 to-transparent"></div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 sm:w-1/4 bg-gradient-to-l from-slate-950 to-transparent"></div>
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial }: { testimonial: any }) {
  return (
    <div className="relative flex w-[350px] flex-col gap-6 rounded-2xl border border-slate-800/60 bg-slate-900/50 p-8 shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-800/80 hover:shadow-2xl hover:shadow-blue-900/20">
      <Quote className="absolute right-6 top-6 h-8 w-8 text-slate-800/50" />
      
      <div className="flex items-center gap-1">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star
            key={i}
            className="h-4 w-4 fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
            aria-hidden
          />
        ))}
      </div>
      
      <p className="flex-1 text-base leading-relaxed text-slate-300">
        &ldquo;{testimonial.quote}&rdquo;
      </p>
      
      <div className="flex items-center gap-4 border-t border-slate-800/60 pt-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-800 text-sm font-bold text-white shadow-inner shadow-white/20">
          {testimonial.avatar}
        </div>
        <div>
          <p className="text-base font-semibold text-white">
            {testimonial.name}
          </p>
          <p className="text-sm font-medium text-blue-400">{testimonial.role}</p>
        </div>
      </div>
    </div>
  );
}
