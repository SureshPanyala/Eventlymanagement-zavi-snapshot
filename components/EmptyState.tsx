import type { ReactNode } from "react";
import { CalendarSearch } from "lucide-react";

export default function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}): JSX.Element {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center">
      <div className="rounded-2xl bg-surface2 p-4">
        <CalendarSearch className="h-7 w-7 text-accent" aria-hidden />
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 max-w-md text-textMuted">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
