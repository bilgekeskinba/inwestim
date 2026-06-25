import { Header } from "@/components/header";
import { PropertyOpportunities } from "@/components/property-opportunities";
import { Footer } from "@/components/footer";
import { getLiveProperties } from "@/lib/properties";

export default async function PropertiesPage() {
  const properties = await getLiveProperties();

  return (
    <main>
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_25%)]" />
        <div className="relative">
          <Header />
          <div className="mx-auto max-w-7xl px-6 py-24 text-center md:px-12 lg:px-20">
            <p className="text-sm font-medium uppercase tracking-[0.32em] text-emerald-300">
              Properties
            </p>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Browse curated real estate investments
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
              Explore the same high-quality property opportunities showcased on the homepage.
            </p>
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-6 py-6 text-center text-sm text-emerald-300 md:px-12 lg:px-20">
        Loaded {properties.length} properties from Supabase
      </div>
      <PropertyOpportunities properties={properties} />
      <Footer />
    </main>
  );
}
