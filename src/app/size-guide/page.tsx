import { SizeChart } from "@/components/shop/size-chart";

export const metadata = { title: "Size guide" };

export default function SizeGuidePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-5xl uppercase leading-none sm:text-6xl">
        Size guide
      </h1>
      <div className="mt-8">
        <SizeChart />
      </div>
    </div>
  );
}
