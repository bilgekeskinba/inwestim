"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const topics = [
  "General enquiry",
  "Investing on Inwestim",
  "Listing a property",
  "Partnerships",
  "Support",
];

const inputClass =
  "w-full rounded-2xl border-2 border-slate-200/80 bg-white px-4 py-3.5 text-[15px] text-slate-900 shadow-sm placeholder:text-slate-400 transition-all duration-300 hover:border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10";
const labelClass = "text-sm font-medium text-slate-700";

export function ContactForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name")?.toString().trim() ?? "";
    const email = formData.get("email")?.toString().trim() ?? "";
    const message = formData.get("message")?.toString().trim() ?? "";

    if (!name || !email || !message) {
      setError("Please fill in your name, email, and message.");
      return;
    }

    // UI only — no backend yet. Show a local success confirmation.
    setError("");
    setIsSubmitted(true);
    e.currentTarget.reset();
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-emerald-200 bg-emerald-50/60 p-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="h-6 w-6 text-emerald-600" />
        </div>
        <p className="mt-4 text-lg font-semibold text-slate-900">Message sent</p>
        <p className="mt-2 max-w-sm text-sm text-slate-600">
          Thanks for reaching out. This is an MVP preview, so messages aren&apos;t
          delivered yet — we&apos;ll wire up real delivery soon.
        </p>
        <Button
          type="button"
          variant="secondary"
          className="mt-6"
          onClick={() => setIsSubmitted(false)}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="name" className={labelClass}>
            Name
          </label>
          <input id="name" name="name" type="text" required placeholder="Jane Doe" className={inputClass} />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="topic" className={labelClass}>
          Topic
        </label>
        <select id="topic" name="topic" defaultValue={topics[0]} className={inputClass}>
          {topics.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="message" className={labelClass}>
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          placeholder="How can we help?"
          className={inputClass}
        />
      </div>

      {error ? <p className="text-sm font-medium text-red-500">{error}</p> : null}

      <Button
        type="submit"
        size="lg"
        className="h-14 w-full rounded-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-base font-semibold text-white shadow-xl shadow-slate-900/25 transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl"
      >
        Send message
      </Button>
    </form>
  );
}
