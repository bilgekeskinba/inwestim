"use client";

import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/property-card";
import { properties } from "@/data/properties";
import { PropertyStatus } from "@/types/property";

/**
 * Property Opportunities Section
 * Displays filterable property investment opportunities
 * TODO: Properties data will be fetched from admin panel / CMS / database in production
 */

type FilterTab = "all" | PropertyStatus;

const filterTabs: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All Opportunities" },
  { id: "live", label: "Live" },
  { id: "funded", label: "Funded" },
  { id: "exited", label: "Exited" },
];

export function PropertyOpportunities() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  // Filter properties based on active tab
  // TODO: This filtering will be done server-side when data comes from database
  const filteredProperties =
    activeFilter === "all"
      ? properties
      : properties.filter((property) => property.status === activeFilter);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50/50 via-white to-white py-24 md:py-32">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(0,0,0,0.03)_1px,transparent_0)] [background-size:32px_32px]" />

      <div className="relative mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
        {/* Section Header */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            {/* Section Label */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">
                Investment Opportunities
              </span>
            </div>

            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Curated Property{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                Investments
              </span>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Access institutional-grade real estate investments. Each property
              is rigorously vetted by our expert team to maximize your returns
              while minimizing risk.
            </p>
          </div>

          <Button
            variant="outline"
            className="group w-fit shrink-0 rounded-full border-2 border-foreground/15 bg-white px-7 py-6 text-base font-semibold shadow-sm transition-all hover:border-foreground hover:bg-foreground hover:text-background hover:shadow-lg"
          >
            View All Properties
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="mt-12 inline-flex flex-wrap gap-2 rounded-2xl border border-border/60 bg-white p-2 shadow-sm">
          {filterTabs.map((tab) => {
            const count =
              tab.id === "all"
                ? properties.length
                : properties.filter((p) => p.status === tab.id).length;
            const isActive = activeFilter === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`relative rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-foreground text-background shadow-lg"
                    : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-2">
                  {tab.label}
                  <span
                    className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                      isActive
                        ? "bg-white/20 text-background"
                        : "bg-slate-200/80 text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Property Cards Grid */}
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>

        {/* Empty State */}
        {filteredProperties.length === 0 && (
          <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-gradient-to-br from-slate-50 to-white py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="mt-4 text-xl font-semibold text-foreground">
              No properties found
            </p>
            <p className="mt-2 max-w-sm text-muted-foreground">
              There are no properties matching this filter at the moment. Check
              back soon for new opportunities.
            </p>
          </div>
        )}

      </div>
    </section>
  );
}
