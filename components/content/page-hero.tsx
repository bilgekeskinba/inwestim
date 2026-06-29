import { Header } from "@/components/header";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
};

/**
 * Shared dark hero used by the static content pages (How It Works, About,
 * Contact). Wraps the white-on-dark Header and a centered heading block, so
 * every content page opens with the same Inwestim style. Content is passed in
 * as props, keeping these pages easy to wire to an admin CMS later.
 */
export function PageHero({ eyebrow, title, subtitle }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_25%)]" />
      <div className="relative">
        <Header />
        <div className="mx-auto max-w-4xl px-6 py-24 text-center md:px-12 lg:px-20">
          {eyebrow ? (
            <p className="text-sm font-medium uppercase tracking-[0.32em] text-emerald-300">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
