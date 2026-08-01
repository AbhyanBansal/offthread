"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCheckoutOrder, confirmPayment } from "@/server/checkout";
import { Button } from "@/components/ui/button";
import { formatPaise } from "@/lib/money";

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpay(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Could not load the payment gateway"));
    document.body.appendChild(script);
  });
}

type FormState = {
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
};

const EMPTY: FormState = {
  name: "",
  email: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

const INPUT =
  "w-full border border-border bg-surface px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted focus:border-foreground focus:outline-none disabled:opacity-60";
const LABEL = "font-mono text-xs uppercase tracking-[0.2em] text-muted";

const FIELDS: {
  key: keyof FormState;
  label: string;
  type?: string;
  full?: boolean;
}[] = [
  { key: "name", label: "Full name", full: true },
  { key: "email", label: "Email", type: "email", full: true },
  { key: "phone", label: "Phone", type: "tel", full: true },
  { key: "line1", label: "Address line 1", full: true },
  { key: "line2", label: "Address line 2 (optional)", full: true },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "pincode", label: "PIN code" },
];

const REQUIRED: (keyof FormState)[] = [
  "name",
  "email",
  "phone",
  "line1",
  "city",
  "state",
  "pincode",
];

export function CheckoutForm({
  total,
  initial,
  hasSaved = false,
  lockEmail = false,
}: {
  total: number;
  initial?: Partial<FormState>;
  hasSaved?: boolean;
  lockEmail?: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ ...EMPTY, ...initial });
  const [mode, setMode] = useState<"summary" | "edit">(
    hasSaved ? "summary" : "edit",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setError(null);
    const missing = REQUIRED.find((k) => !form[k]?.trim());
    if (missing) {
      setError("Please fill in all required details.");
      setMode("edit");
      return;
    }

    setLoading(true);
    try {
      await loadRazorpay();
      const order = await createCheckoutOrder(form);
      if (!window.Razorpay) throw new Error("Payment gateway unavailable");

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: "INR",
        name: "OFFTHREAD",
        description: `Order ${order.orderNumber}`,
        order_id: order.razorpayOrderId,
        prefill: order.prefill,
        theme: { color: "#e0432a" },
        handler: async (r: RazorpayResponse) => {
          try {
            const res = await confirmPayment({
              razorpayOrderId: r.razorpay_order_id,
              razorpayPaymentId: r.razorpay_payment_id,
              signature: r.razorpay_signature,
            });
            router.push(`/orders/${res.orderNumber}`);
          } catch {
            setError(
              "We couldn't verify your payment. If you were charged, contact us with your email.",
            );
            setLoading(false);
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {mode === "summary" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className={LABEL}>Delivery details</h2>
            <button
              type="button"
              onClick={() => setMode("edit")}
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent hover:underline"
            >
              Change
            </button>
          </div>
          <div className="border border-border p-5 font-mono text-xs">
            <p className="text-sm">{form.name}</p>
            <p className="mt-1 text-muted">
              {form.phone} · {form.email}
            </p>
            <p className="mt-3">
              {form.line1}
              {form.line2 ? `, ${form.line2}` : ""}
            </p>
            <p>
              {form.city}, {form.state} {form.pincode}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <h2 className={LABEL}>Shipping details</h2>
          <div className="grid grid-cols-2 gap-4">
            {FIELDS.map((f) => (
              <label key={f.key} className={f.full ? "col-span-2" : "col-span-1"}>
                <span className="sr-only">{f.label}</span>
                <input
                  type={f.type ?? "text"}
                  placeholder={f.label}
                  value={form[f.key]}
                  disabled={f.key === "email" && lockEmail}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, [f.key]: e.target.value }))
                  }
                  className={INPUT}
                />
              </label>
            ))}
          </div>
          {hasSaved ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setMode("summary")}
            >
              Done
            </Button>
          ) : null}
        </div>
      )}

      {error ? <p className="font-mono text-xs text-accent">{error}</p> : null}

      <Button
        type="button"
        onClick={pay}
        size="lg"
        className="w-full"
        disabled={loading}
      >
        {loading ? "Processing…" : `Pay ${formatPaise(total)}`}
      </Button>
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
        Secured by Razorpay · UPI · cards · netbanking
      </p>
    </div>
  );
}
