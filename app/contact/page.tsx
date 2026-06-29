import type { Metadata } from "next";
import { Mail, MessageSquare, MapPin } from "lucide-react";
import { PageHero } from "@/components/content/page-hero";
import { ContactForm } from "@/components/contact-form";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Contact | Inwestim",
  description: "Get in touch with the Inwestim team.",
};

const details = [
  {
    icon: Mail,
    title: "Email",
    body: "We aim to respond within a couple of business days.",
  },
  {
    icon: MessageSquare,
    title: "Support",
    body: "Questions about investing, listings, or your account.",
  },
  {
    icon: MapPin,
    title: "Where we work",
    body: "A remote-first team building the future of property investing.",
  },
];

export default function ContactPage() {
  return (
    <main className="bg-white">
      <PageHero
        eyebrow="Contact"
        title="Get in touch"
        subtitle="Have a question about Inwestim? Send us a message and we'll get back to you."
      />

      <section className="mx-auto max-w-5xl px-6 py-20 md:px-12 lg:px-20">
        <div className="grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Talk to us</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-600">
              Whether you&apos;re exploring an investment, want to list a property, or just have a
              question, we&apos;d love to hear from you.
            </p>
            <div className="mt-8 space-y-6">
              {details.map((detail) => (
                <div key={detail.title} className="flex gap-4">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                    <detail.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{detail.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{detail.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
