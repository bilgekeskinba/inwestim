import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/30 to-white py-24 md:py-32">
      {/* Background elements matching how-it-works */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.05),transparent)]" />

      <div className="relative mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
        <div className="mx-auto max-w-2xl text-center">
          {/* Section Label - matching how-it-works style */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">
              Get Started
            </span>
          </div>

          {/* Heading - matching how-it-works typography */}
          <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Ready to start{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              investing
            </span>
            ?
          </h2>

          {/* Description - matching how-it-works style */}
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Join thousands of investors building wealth through carefully
            selected real estate opportunities.
          </p>

          {/* Single Primary CTA */}
          <div className="mt-10">
            <Button
              asChild
              size="lg"
              className="group h-14 rounded-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-10 text-base font-semibold text-white shadow-xl shadow-slate-900/25 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-900/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Link href="/properties">
                Start Investing Now
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
