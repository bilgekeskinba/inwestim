"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { PropertyDocument } from "@/types/property";

export const DOCUMENT_TYPES = [
  "prospectus",
  "appraisal",
  "legal",
  "insurance",
  "floor_plan",
  "financial_report",
  "other",
] as const;

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-[15px] text-white shadow-sm placeholder:text-slate-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";
const labelClass = "text-sm font-medium text-slate-300";

function typeLabel(type: string): string {
  return type.replace(/_/g, " ");
}

export function PropertyDocuments({
  propertyId,
  documents,
}: {
  propertyId: string;
  documents: PropertyDocument[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState<string>(DOCUMENT_TYPES[0]);
  const [fileUrl, setFileUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("Enter a document title.");
      return;
    }
    if (!fileUrl.trim()) {
      setError("Enter a file URL.");
      return;
    }

    setIsSubmitting(true);
    const supabase = getSupabaseBrowserClient();
    const { error: insertError } = await supabase.from("property_documents").insert({
      property_id: propertyId,
      title: title.trim(),
      document_type: documentType,
      file_url: fileUrl.trim(),
      is_public: isPublic,
    });

    if (insertError) {
      setIsSubmitting(false);
      setError(insertError.message);
      return;
    }

    setIsSubmitting(false);
    setSuccess("Document added.");
    setTitle("");
    setFileUrl("");
    router.refresh();
  };

  const handleDelete = async (id: string, docTitle: string) => {
    if (typeof window !== "undefined") {
      const ok = window.confirm(`Delete "${docTitle}"?`);
      if (!ok) return;
    }
    setBusyId(id);
    const supabase = getSupabaseBrowserClient();
    const { error: deleteError } = await supabase
      .from("property_documents")
      .delete()
      .eq("id", id);

    setBusyId(null);
    if (deleteError) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[admin] document delete failed", deleteError);
      }
      if (typeof window !== "undefined") {
        window.alert(`Could not delete document: ${deleteError.message}`);
      }
      return;
    }
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="doc_title" className={labelClass}>
              Title
            </label>
            <input
              id="doc_title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Prospectus 2026"
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="doc_type" className={labelClass}>
              Document type
            </label>
            <select
              id="doc_type"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className={inputClass}
            >
              {DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type} className="bg-slate-900 capitalize">
                  {typeLabel(type)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="doc_url" className={labelClass}>
              File URL
            </label>
            <input
              id="doc_url"
              type="url"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://…"
              className={inputClass}
            />
          </div>
          <label className="flex items-center gap-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-slate-950/60"
            />
            Public (visible on the property detail page)
          </label>
        </div>

        {error ? <p className="text-sm font-medium text-red-400">{error}</p> : null}
        {success ? <p className="text-sm font-medium text-emerald-400">{success}</p> : null}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding…" : "Add document"}
        </Button>
      </form>

      {documents.length > 0 ? (
        <div className="flex flex-col gap-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-slate-950/60 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="truncate text-base font-medium text-white">{doc.title}</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium capitalize text-slate-300">
                    {typeLabel(doc.document_type)}
                  </span>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      doc.is_public
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                        : "border-slate-400/30 bg-slate-400/10 text-slate-300"
                    }`}
                  >
                    {doc.is_public ? "Public" : "Private"}
                  </span>
                </div>
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block truncate text-xs text-emerald-300 underline-offset-2 hover:underline"
                >
                  {doc.file_url}
                </a>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(doc.id, doc.title)}
                disabled={busyId === doc.id}
              >
                Delete
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[120px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-950/60 p-8 text-center">
          <p className="text-sm text-slate-400">No documents yet.</p>
        </div>
      )}
    </div>
  );
}
