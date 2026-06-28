"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export type PropertyFormValues = {
  id?: string;
  title: string;
  location: string;
  description: string;
  image_url: string;
  total_value: number;
  minimum_investment: number;
  expected_annual_return: number;
  monthly_rental_income: number;
  funding_percentage: number;
  risk_level: string;
  status: string;
};

const STATUS_OPTIONS = ["draft", "live", "funded", "exited"];
const RISK_OPTIONS = ["low", "medium", "high"];

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-[15px] text-white shadow-sm placeholder:text-slate-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";
const labelClass = "text-sm font-medium text-slate-300";

type Props = {
  mode: "create" | "edit";
  initialValues?: PropertyFormValues;
};

function toNumber(value: FormDataEntryValue | null): number {
  return Number(value ?? 0) || 0;
}

export function PropertyForm({ mode, initialValues }: Props) {
  const router = useRouter();
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const title = formData.get("title")?.toString().trim() ?? "";
    const location = formData.get("location")?.toString().trim() ?? "";

    if (!title || !location) {
      setFormError("Title and location are required.");
      return;
    }

    setFormError("");
    setIsSubmitting(true);

    const payload = {
      title,
      location,
      description: formData.get("description")?.toString().trim() ?? "",
      image_url: formData.get("image_url")?.toString().trim() ?? "",
      total_value: toNumber(formData.get("total_value")),
      minimum_investment: toNumber(formData.get("minimum_investment")),
      expected_annual_return: toNumber(formData.get("expected_annual_return")),
      monthly_rental_income: toNumber(formData.get("monthly_rental_income")),
      funding_percentage: toNumber(formData.get("funding_percentage")),
      risk_level: formData.get("risk_level")?.toString() ?? "medium",
      status: formData.get("status")?.toString() ?? "draft",
    };

    const supabase = getSupabaseBrowserClient();

    const { error } =
      mode === "edit" && initialValues?.id
        ? await supabase.from("properties").update(payload).eq("id", initialValues.id)
        : await supabase.from("properties").insert(payload);

    if (error) {
      setFormError(error.message);
      setIsSubmitting(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="title" className={labelClass}>
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={initialValues?.title ?? ""}
            placeholder="Kadıköy Prime Residence"
            className={inputClass}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="location" className={labelClass}>
            Location
          </label>
          <input
            id="location"
            name="location"
            type="text"
            required
            defaultValue={initialValues?.location ?? ""}
            placeholder="Kadıköy, İstanbul"
            className={inputClass}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="description" className={labelClass}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={initialValues?.description ?? ""}
            placeholder="Short summary of the opportunity."
            className={inputClass}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="image_url" className={labelClass}>
            Image URL
          </label>
          <input
            id="image_url"
            name="image_url"
            type="url"
            defaultValue={initialValues?.image_url ?? ""}
            placeholder="https://images.unsplash.com/..."
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="total_value" className={labelClass}>
            Total value (TL)
          </label>
          <input
            id="total_value"
            name="total_value"
            type="number"
            min="0"
            step="any"
            defaultValue={initialValues?.total_value ?? 0}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="minimum_investment" className={labelClass}>
            Minimum investment (TL)
          </label>
          <input
            id="minimum_investment"
            name="minimum_investment"
            type="number"
            min="0"
            step="any"
            defaultValue={initialValues?.minimum_investment ?? 0}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="expected_annual_return" className={labelClass}>
            Expected annual return (%)
          </label>
          <input
            id="expected_annual_return"
            name="expected_annual_return"
            type="number"
            min="0"
            step="any"
            defaultValue={initialValues?.expected_annual_return ?? 0}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="monthly_rental_income" className={labelClass}>
            Monthly rental income (TL)
          </label>
          <input
            id="monthly_rental_income"
            name="monthly_rental_income"
            type="number"
            min="0"
            step="any"
            defaultValue={initialValues?.monthly_rental_income ?? 0}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="funding_percentage" className={labelClass}>
            Funding percentage (%)
          </label>
          <input
            id="funding_percentage"
            name="funding_percentage"
            type="number"
            min="0"
            max="100"
            step="any"
            defaultValue={initialValues?.funding_percentage ?? 0}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="risk_level" className={labelClass}>
            Risk level
          </label>
          <select
            id="risk_level"
            name="risk_level"
            defaultValue={initialValues?.risk_level ?? "medium"}
            className={inputClass}
          >
            {RISK_OPTIONS.map((risk) => (
              <option key={risk} value={risk} className="bg-slate-900">
                {risk}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="status" className={labelClass}>
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={initialValues?.status ?? "draft"}
            className={inputClass}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status} className="bg-slate-900">
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {formError ? (
        <p className="text-sm font-medium text-red-400">{formError}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {mode === "edit" ? "Save changes" : "Create property"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/admin")}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
