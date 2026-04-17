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
  ];

  return (
    <section id="testimonials" className="relative overflow-hidden bg-brand py-24">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent pointer-events-none" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        <div className="mb-16 text-center">
          <span className="mb-3 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-semibold text-white/90 shadow-sm">
            {t("landing.testimonials.badge")}
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {t("landing.testimonials.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/60">
            {t("landing.testimonials.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="relative flex flex-col gap-6 rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/10"
            >
              <Quote className="absolute right-6 top-6 h-8 w-8 text-white/10" />

              <div className="flex items-center gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                    aria-hidden
                  />
                ))}
              </div>

              <p className="flex-1 text-base leading-relaxed text-white/80">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              <div className="flex items-center gap-4 border-t border-white/10 pt-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary-foreground shadow-inner">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="text-base font-semibold text-white">
                    {testimonial.name}
                  </p>
                  <p className="text-sm font-medium text-primary/80">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
