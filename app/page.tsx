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
      <CTASection />
      <Footer />
    </main>
  );
}
