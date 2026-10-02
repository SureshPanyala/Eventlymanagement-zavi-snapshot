// Shared by server and client code (no DB access here).
export const CATEGORIES = [
  { slug: "technology", label: "Technology", blurb: "Conferences, meetups and hack nights" },
  { slug: "business", label: "Business", blurb: "Founders, networking and growth" },
  { slug: "music", label: "Music", blurb: "Concerts, showcases and live sessions" },
  { slug: "design", label: "Design", blurb: "Product, UX and creative craft" },
  { slug: "education", label: "Education", blurb: "Workshops, courses and talks" },
] as const;

export type Category = (typeof CATEGORIES)[number]["slug"];

export function isCategory(v: unknown): v is Category {
  return typeof v === "string" && CATEGORIES.some((c) => c.slug === v);
}

export function categoryLabel(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? "Event";
}

/** Gradient pairs per category, used by the banner fallback art. */
export const CATEGORY_GRADIENT: Record<Category, [string, string]> = {
  technology: ["#1e3a8a", "#0ea5e9"],
  business: ["#0f766e", "#84cc16"],
  music: ["#be185d", "#f97316"],
  design: ["#6d28d9", "#ec4899"],
  education: ["#b45309", "#facc15"],
};
