"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type Props = {
  id: string;
  title: string;
};

export function DeletePropertyButton({ id, title }: Props) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(`Delete "${title}"? This cannot be undone.`);
      if (!confirmed) return;
    }

    setIsDeleting(true);

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("properties").delete().eq("id", id);

    if (error) {
      setIsDeleting(false);
      if (process.env.NODE_ENV !== "production") {
        console.error("[admin] property delete failed", error);
      }
      if (typeof window !== "undefined") {
        window.alert(`Could not delete property: ${error.message}`);
      }
      return;
    }

    router.refresh();
  };

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? "Deleting…" : "Delete"}
    </Button>
  );
}
