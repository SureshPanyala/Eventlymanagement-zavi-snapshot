import CategoryIcon from "@/components/CategoryIcon";
import { categoryLabel } from "@/lib/categories";
import { cn } from "@/lib/utils";

export default function CategoryBadge({ category, className }: { category: string; className?: string }): JSX.Element {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-surface/95 px-2.5 py-1 text-xs font-semibold text-text shadow-sm ring-1 ring-border",
        className,
      )}
    >
      <CategoryIcon category={category} className="h-3.5 w-3.5 text-accent" />
      {categoryLabel(category)}
    </span>
  );
}
