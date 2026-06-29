import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/content/page-hero";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "About | Inwestim",
  description: "Learn about Inwestim's mission to make fractional real-estate investing simple, transparent, and USDC-native.",
};

const sections = [
  {
    title: "Our mission",
    body: "Inwestim exists to make high-quality real-estate investing accessible to everyone. We turn large, illiquid properties into small, transparent positions you can hold and track with ease.",
  },
  {
    title: "Why fractional real estate",
    body: "Owning whole properties is capital-intensive and hard to diversify. Fractional ownership lets you spread smaller amounts across multiple properties, lowering the barrier to entry while keeping exposure to a proven asset class.",
  },
  {
    title: "Why USDC",
    body: "We denominate everything in USDC for a stable, borderless, and programmable unit of account. It keeps pricing consistent, simplifies settlement, and prepares the platform for on-chain integration without currency conversion.",
  },
  {
    title: "What makes Inwestim different",
    body: "A clean, position-first experience: every purchase is preserved as its own lot in the ledger, while your dashboard aggregates them into clear positions. Curated listings, transparent funding progress, and a straightforward review process keep the flow honest and simple.",
  },
  {
    title: "Current MVP status",
    body: "Inwestim is in an MVP / simulation phase. Browsing, investing in USDC, admin approval, position tracking, and distribution summaries are live. Payments and on-chain settlement are simulated for now.",
  },
  {
    title: "Long-term roadmap",
    body: "Next steps include wallet integration and automated USDC settlement, a public property detail and document center, secondary transfers, and richer distribution scheduling — building toward a fully on-chain investment experience.",
  },
];

export default function AboutPage() {
  return (
    <main className="bg-white">
      <PageHero
        eyebrow="About"
        title="Building the future of property investing"
        subtitle="Inwestim makes fractional, USDC-native real-estate investing simple, transparent, and accessible."
      />

      <section className="mx-auto max-w-4xl px-6 py-20 md:px-12 lg:px-20">
        <div className="space-y-12">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {section.title}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-600">{section.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-wrap gap-4 rounded-3xl border border-slate-200/80 bg-slate-50/70 p-8">
          <div className="flex-1 min-w-[240px]">
            <h2 className="text-xl font-semibold text-slate-900">Ready to explore?</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
              Browse curated properties or learn how the investment flow works.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href="/properties">Browse properties</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/how-it-works">How it works</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
