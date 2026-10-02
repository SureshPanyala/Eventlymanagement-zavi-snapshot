"use client";

import { useState } from "react";
import CategoryIcon from "@/components/CategoryIcon";
import { CATEGORY_GRADIENT, isCategory } from "@/lib/categories";
import { cn } from "@/lib/utils";

/** Event image. Always renders: a category gradient with an icon sits underneath,
 *  and a banner URL (if any) is layered on top and removed if it fails to load. */
export default function EventBanner({
  bannerUrl,
  category,
  title,
  className,
  large = false,
}: {
  bannerUrl: string | null;
  category: string;
  title: string;
  className?: string;
  large?: boolean;
}): JSX.Element {
  const [failed, setFailed] = useState(false);
  const [from, to] = isCategory(category) ? CATEGORY_GRADIENT[category] : ["#44403c", "#a8a29e"];
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      <div className="banner-pattern absolute inset-0" aria-hidden />
      <div
        className="absolute -bottom-10 -right-10 rounded-full bg-white/10"
        style={{ width: large ? 320 : 160, height: large ? 320 : 160 }}
        aria-hidden
      />
      <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
        <div className={cn("rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/25", large ? "p-6" : "p-4")}>
          <CategoryIcon category={category} className={cn("text-white", large ? "h-14 w-14" : "h-9 w-9")} strokeWidth={1.6} />
        </div>
      </div>
      {bannerUrl && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bannerUrl}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="sr-only">{title}</span>
      )}
    </div>
  );
}
