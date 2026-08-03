import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReviewStars({
  rating,
  className,
}: {
  rating: number;
  className?: string;
}) {
  const rounded = Math.round(rating);
  return (
    <div
      className={cn("flex gap-0.5", className)}
      aria-label={`${rating.toFixed(1)} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i <= rounded
              ? "fill-accent text-accent"
              : "fill-transparent text-border",
          )}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}
