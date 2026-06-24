"use client";

import { ArrowRight, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/header";

export function Hero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-bg.jpg"
          alt="Modern luxury property"
          fill
          className="object-cover object-center"
          priority
          quality={90}
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
      </div>

      <Header />

      {/* Hero Content */}
      <div className="relative z-10 flex min-h-[calc(100vh-88px)] flex-col items-center justify-center px-6 text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-medium text-white/90">
            Trusted by 10,000+ investors
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="max-w-4xl text-balance text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          Your Gateway to Smarter Property
        </h1>

        {/* Subheadline */}
        <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-white/75 sm:text-xl md:mt-8">
          Invest in carefully selected properties and start building long-term
          wealth.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 mb-24 flex flex-col items-center gap-4 sm:flex-row sm:gap-5 md:mt-12 md:mb-28">
          <Button
            asChild
            size="lg"
            className="group h-14 rounded-full bg-white px-8 text-base font-semibold text-slate-900 shadow-xl shadow-black/25 transition-all hover:bg-white/95 hover:shadow-2xl hover:scale-[1.02]"
          >
            <Link href="/register">
              Start Investing Now
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>

          <a
            href="/#how-it-works"
            className="group flex h-14 items-center gap-2.5 rounded-full border-2 border-white/70 px-7 text-base font-semibold text-white transition-all hover:border-white hover:bg-white/10"
          >
            <PlayCircle className="h-5 w-5" />
            <span>Learn How It Works</span>
          </a>
        </div>

      </div>

      {/* Bottom gradient fade - subtle, sits below the CTAs */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background via-background/40 to-transparent" />

      {/* Minimal scroll indicator */}
      <div className="absolute bottom-10 left-1/2 z-20 -translate-x-1/2">
        <div className="flex flex-col items-center gap-1 opacity-40 transition-opacity hover:opacity-60">
          <div className="h-8 w-[1px] bg-gradient-to-b from-transparent via-white/60 to-white/20" />
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/50" />
        </div>
      </div>
    </section>
  );
}
