import { Hero } from "@/components/hero";
import { PropertyOpportunities } from "@/components/property-opportunities";
import { HowItWorks } from "@/components/how-it-works";
import { CTASection } from "@/components/cta-section";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <PropertyOpportunities />
      <HowItWorks />
      <div id="about" className="h-px w-full" aria-hidden="true" />
      <div id="contact" className="h-px w-full" aria-hidden="true" />
      <CTASection />
      <Footer />
    </main>
  );
}
