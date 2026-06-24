"use client";

import { useState } from "react";
import Image from "next/image";
import {
  UserPlus,
  Search,
  TrendingUp,
  LayoutDashboard,
  Wallet,
  Shield,
  Building2,
  PieChart,
} from "lucide-react";

const steps = [
  {
    id: 1,
    title: "Register",
    description:
      "Create your account and complete your investor profile in minutes.",
    icon: UserPlus,
  },
  {
    id: 2,
    title: "Explore Opportunities",
    description:
      "Browse selected real estate opportunities with clear financial details.",
    icon: Search,
  },
  {
    id: 3,
    title: "Start Investing",
    description:
      "Choose a property that matches your goals and invest from a low entry amount.",
    icon: TrendingUp,
  },
  {
    id: 4,
    title: "Track Your Portfolio",
    description:
      "Monitor rental income, valuation updates, and investment performance from your dashboard.",
    icon: LayoutDashboard,
  },
  {
    id: 5,
    title: "Earn",
    description:
      "Receive potential rental income and returns as your investment grows.",
    icon: Wallet,
  },
];

const floatingCards = [
  {
    label: "Low Entry",
    icon: Wallet,
    position: "top-8 -left-4 md:top-12 md:-left-8",
    delay: "0s",
  },
  {
    label: "Real Estate Backed",
    icon: Building2,
    position: "top-1/3 -right-4 md:-right-12",
    delay: "0.5s",
  },
  {
    label: "Portfolio Tracking",
    icon: PieChart,
    position: "bottom-24 -left-2 md:bottom-32 md:-left-6",
    delay: "1s",
  },
];

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(1);

  return (
    <section
      id="how-it-works"
      className="relative scroll-mt-20 overflow-hidden bg-gradient-to-b from-white via-slate-50/30 to-white py-24 md:py-32"
    >
      {/* Background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.08),transparent)]" />
      <div className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-emerald-100/30 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-slate-100/50 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5">
            <Shield className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">
              Simple Process
            </span>
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            How it{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              works
            </span>
            ?
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Start investing in selected properties in just a few simple steps.
          </p>
        </div>

        {/* Main Content */}
        <div className="mt-16 grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Left: Steps */}
          <div className="space-y-2">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = activeStep === step.id;

              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`group relative w-full rounded-2xl p-5 text-left transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-50 to-teal-50/50 shadow-lg shadow-emerald-100/50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  {/* Active indicator line */}
                  <div
                    className={`absolute left-0 top-1/2 h-12 w-1 -translate-y-1/2 rounded-r-full transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-b from-emerald-500 to-teal-500"
                        : "bg-transparent"
                    }`}
                  />

                  <div className="flex items-start gap-4">
                    {/* Step Number & Icon */}
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                        isActive
                          ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200"
                          : "bg-slate-100 text-muted-foreground group-hover:bg-slate-200"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-bold uppercase tracking-wider ${
                            isActive
                              ? "text-emerald-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          Step {step.id}
                        </span>
                      </div>
                      <h3
                        className={`mt-1 text-lg font-semibold transition-colors ${
                          isActive ? "text-foreground" : "text-foreground/80"
                        }`}
                      >
                        {step.title}
                      </h3>
                      <p
                        className={`mt-1 text-sm leading-relaxed transition-all duration-300 ${
                          isActive
                            ? "max-h-20 text-muted-foreground opacity-100"
                            : "max-h-0 opacity-0 lg:max-h-20 lg:opacity-70"
                        }`}
                      >
                        {step.description}
                      </p>
                    </div>

                    {/* Arrow indicator */}
                    <div
                      className={`hidden h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 lg:flex ${
                        isActive
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-transparent text-muted-foreground/50"
                      }`}
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Phone Mockup with Floating Cards */}
          <div className="relative flex items-center justify-center lg:justify-end">
            {/* Glow effect behind phone */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-80 w-80 rounded-full bg-gradient-to-br from-emerald-200/40 to-teal-200/40 blur-3xl" />
            </div>

            {/* Phone mockup container */}
            <div className="relative z-10">
              {/* Phone frame */}
              <div className="relative mx-auto w-64 overflow-hidden rounded-[2.5rem] border-8 border-slate-900 bg-slate-900 shadow-2xl shadow-slate-900/30 sm:w-72">
                {/* Phone notch */}
                <div className="absolute left-1/2 top-0 z-20 h-6 w-24 -translate-x-1/2 rounded-b-2xl bg-slate-900" />

                {/* Screen content */}
                <div className="relative aspect-[9/19] w-full overflow-hidden bg-slate-900">
                  <Image
                    src="/images/app-mockup.jpg"
                    alt="Inwestim mobile app dashboard"
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 256px, 288px"
                  />
                </div>

                {/* Home indicator */}
                <div className="absolute bottom-2 left-1/2 h-1 w-24 -translate-x-1/2 rounded-full bg-white/30" />
              </div>

              {/* Floating benefit cards */}
              {floatingCards.map((card, index) => {
                const CardIcon = card.icon;
                return (
                  <div
                    key={index}
                    className={`absolute ${card.position} z-20 animate-float`}
                    style={{
                      animationDelay: card.delay,
                      animationDuration: "4s",
                    }}
                  >
                    <div className="flex items-center gap-2.5 rounded-xl border border-white/80 bg-white/95 px-4 py-2.5 shadow-lg shadow-slate-200/50 backdrop-blur-sm">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                        <CardIcon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {card.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Float animation keyframes - added via Tailwind arbitrary */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-12px);
          }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
