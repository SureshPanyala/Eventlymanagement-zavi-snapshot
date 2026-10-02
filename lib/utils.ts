import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// cn — the canonical shadcn/ui class-name merge helper. Composes conditional
// clsx classes and de-duplicates conflicting Tailwind utilities so component
// variants and caller overrides combine predictably.
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
