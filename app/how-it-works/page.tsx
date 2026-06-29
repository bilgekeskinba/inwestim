import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/content/page-hero";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "How It Works | Inwestim",
  description: "Understand how investing on Inwestim works, from browsing properties to monthly distributions.",
};

const steps = [
  {
    title: "Browse selected properties",
    body: "Explore a curated set of live real-estate opportunities. Each listing includes the target raise, minimum investment, expected annual return, and funding progress.",
  },
  {
    title: "Invest using USDC",
    body: "Pick an amount at or above the property minimum and submit your investment in USDC. Every purchase is tracked as its own lot, so different dates and terms stay separate.",
  },
  {
    title: "Investment request review",
    body: "Your request is recorded as a pending position. You can see it in your dashboard while it awaits review.",
  },
  {
    title: "Admin approval",
    body: "An administrator reviews and approves valid requests, confirming your allocation in the property.",
  },
  {
    title: "Active position",
    body: "Approved purchases become an active position. Your dashboard groups lots by property so you see total invested, number of purchases, and the latest purchase date.",
  },
  {
    title: "Monthly distributions",
    body: "Eligible positions accrue estimated monthly distributions over the holding period, summarised on your dashboard.",
  },
  {
    title: "Future wallet integration",
    body: "On-chain wallet connection and automated USDC settlement are planned for a later phase. Today's flow simulates that experience end to end.",
  },
];

const faqs = [
  {
    q: "What currency does Inwestim use?",
    a: "All amounts on the platform are denominated in USDC. Values are not converted between currencies.",
  },
  {
    q: "Can I invest in the same property more than once?",
    a: "Yes. Each purchase is preserved as a separate lot, and your dashboard aggregates them into a single position per property.",
  },
  {
    q: "What happens after I submit an investment?",
    a: "It becomes a pending request until an administrator approves it. Once approved, it appears as an active position.",
  },
  {
    q: "Is there a wallet or on-chain settlement yet?",
    a: "Not yet. Wallet integration and automated settlement are on the roadmap; the current release focuses on the core investment flow.",
  },
];

function StepCard({ index, title, body }: { index: number; title: string; body: string }) {
  return (
    <div className="flex gap-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-base font-bold text-white shadow-lg shadow-emerald-500/20">
        {index}
      </div>
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{body}</p>
      </div>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <main className="bg-white">
      <PageHero
        eyebrow="How It Works"
        title="How Inwestim Works"
        subtitle="From browsing curated properties to receiving monthly distributions — here's the full journey, step by step."
      />

      <section className="mx-auto max-w-5xl px-6 py-20 md:px-12 lg:px-20">
        <div className="grid gap-5 sm:grid-cols-2">
          {steps.map((step, index) => (
            <StepCard key={step.title} index={index + 1} title={step.title} body={step.body} />
          ))}
        </div>
      </section>

      <section className="bg-slate-50/70 py-20">
        <div className="mx-auto max-w-3xl px-6 md:px-12 lg:px-20">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-emerald-600">FAQ</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Frequently asked questions
          </h2>
          <div className="mt-8 space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm"
              >
                <h3 className="text-base font-semibold text-slate-900">{faq.q}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 md:px-12 lg:px-20">
        <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-8">
          <h2 className="text-lg font-semibold text-amber-900">Important note</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-amber-800">
            Inwestim is currently in an MVP / simulation phase. The investment flow is provided for
            demonstration purposes only and does not constitute investment advice, an offer, or a
            solicitation. Figures shown are illustrative and may not reflect real returns.
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link href="/properties">Browse properties</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
