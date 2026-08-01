import { ReturnPolicy } from "@/components/shop/return-policy";

export const metadata = { title: "Returns & exchanges" };

export default function ReturnsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-5xl uppercase leading-none sm:text-6xl">
        Returns &amp; exchanges
      </h1>
      <div className="mt-8">
        <ReturnPolicy />
      </div>
      <p className="mt-8 text-sm leading-relaxed text-muted">
        Need an exchange? Email us your order number and the size you&apos;d like
        instead — we&apos;ll sort it out, no questions asked.
      </p>
    </div>
  );
}
