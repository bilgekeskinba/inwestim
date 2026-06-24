import Image from "next/image";
import {
  TrendingUp,
  Building2,
  ShieldCheck,
  PieChart,
} from "lucide-react";

const stats = [
  { label: "Avg. Annual Return", value: "12.4%", icon: TrendingUp },
  { label: "Active Properties", value: "240+", icon: Building2 },
];

const highlights = [
  { label: "Bank-grade security", icon: ShieldCheck },
  { label: "Real estate backed assets", icon: Building2 },
  { label: "Live portfolio tracking", icon: PieChart },
];

export function AuthVisual() {
  return (
    <div className="relative hidden h-full overflow-hidden rounded-3xl border border-white/10 lg:block">
      {/* Background image */}
      <Image
        src="/images/hero-bg.jpg"
        alt="Modern luxury property"
        fill
        className="object-cover object-center"
        quality={90}
        sizes="(max-width: 1024px) 0px, 45vw"
      />
      {/* Dark overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(16,185,129,0.18),transparent)]" />

      {/* Content */}
      <div className="relative flex h-full flex-col justify-between p-10">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
            <span className="text-xl font-bold text-white">I</span>
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">
            Inwestim
          </span>
        </div>

        {/* Middle copy */}
        <div className="max-w-sm">
          <h2 className="text-balance text-3xl font-bold leading-tight tracking-tight text-white">
            Your Gateway to Smarter Property
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-white/70">
            Invest in carefully selected properties and start building long-term
            wealth.
          </p>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="mt-3 text-2xl font-bold text-white">
                    {stat.value}
                  </p>
                  <p className="text-xs font-medium text-white/60">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Highlights */}
        <ul className="space-y-3">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.label}
                className="flex items-center gap-3 text-sm font-medium text-white/80"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {item.label}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
