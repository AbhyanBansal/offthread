import { clsx, type ClassValue } from "clsx";

/**
 * Merge class names. We use plain clsx (no tailwind-merge) to keep the Worker
 * bundle small; call sites add non-conflicting utilities, so conflict
 * resolution isn't needed.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** URL-safe slug from arbitrary text. */
export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}
