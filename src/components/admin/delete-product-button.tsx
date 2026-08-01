"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteProduct } from "@/server/admin";

export function DeleteProductButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`Delete ${name}`}
      onClick={() => {
        if (confirm(`Delete "${name}"? This cannot be undone.`)) {
          startTransition(async () => {
            await deleteProduct(id);
          });
        }
      }}
      className="text-muted transition-colors hover:text-accent disabled:opacity-40"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
