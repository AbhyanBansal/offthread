"use client";

import { useState } from "react";
import { imageUrl } from "@/lib/cdn";
import { cn } from "@/lib/utils";

type GalleryImage = { s3Key: string; alt: string | null };

export function ProductGallery({
  images,
  name,
}: {
  images: GalleryImage[];
  name: string;
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[3/4] items-center justify-center bg-surface p-6">
        <span className="text-center font-display text-4xl uppercase leading-none text-border">
          {name}
        </span>
      </div>
    );
  }

  return (
    // Thumbnails sit to the LEFT of the main image on laptops/desktops
    // (and below it on mobile) for quick previewing.
    <div className="flex flex-col gap-3 sm:flex-row">
      {images.length > 1 ? (
        <div className="order-2 flex gap-3 sm:order-1 sm:w-20 sm:flex-col">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={cn(
                "aspect-square w-16 shrink-0 overflow-hidden border sm:w-full",
                i === active
                  ? "border-foreground"
                  : "border-border/60 hover:border-foreground",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl(img.s3Key)}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}

      <div className="order-1 flex-1 sm:order-2">
        <div className="aspect-[3/4] overflow-hidden bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl(images[active].s3Key)}
            alt={images[active].alt ?? name}
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
