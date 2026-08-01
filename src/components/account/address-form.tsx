"use client";

import { useState, useTransition } from "react";
import { saveAddress } from "@/server/account";
import { Button } from "@/components/ui/button";

type Addr = {
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
};

const EMPTY: Addr = {
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

const INPUT =
  "w-full border border-border bg-surface px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted focus:border-foreground focus:outline-none";

const FIELDS: { key: keyof Addr; label: string; full?: boolean }[] = [
  { key: "name", label: "Full name", full: true },
  { key: "phone", label: "Phone", full: true },
  { key: "line1", label: "Address line 1", full: true },
  { key: "line2", label: "Address line 2 (optional)", full: true },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "pincode", label: "PIN code" },
];

const REQUIRED: (keyof Addr)[] = [
  "name",
  "phone",
  "line1",
  "city",
  "state",
  "pincode",
];

export function AddressForm({ initial }: { initial?: Partial<Addr> }) {
  const [form, setForm] = useState<Addr>({ ...EMPTY, ...initial });
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const missing = REQUIRED.find((k) => !form[k]?.trim());
    if (missing) {
      setError("Please fill in all required fields.");
      return;
    }
    startTransition(async () => {
      try {
        await saveAddress(form);
        setSaved(true);
      } catch {
        setError("Couldn't save. Please try again.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {FIELDS.map((f) => (
          <label key={f.key} className={f.full ? "col-span-2" : "col-span-1"}>
            <span className="sr-only">{f.label}</span>
            <input
              placeholder={f.label}
              value={form[f.key]}
              onChange={(e) =>
                setForm((s) => ({ ...s, [f.key]: e.target.value }))
              }
              className={INPUT}
            />
          </label>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save details"}
        </Button>
        {saved ? (
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
            Saved ✓
          </span>
        ) : null}
      </div>
      {error ? (
        <p className="font-mono text-xs text-accent">{error}</p>
      ) : null}
    </form>
  );
}
