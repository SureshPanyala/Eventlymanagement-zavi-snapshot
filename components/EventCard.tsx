import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import EventBanner from "@/components/EventBanner";
import CategoryBadge from "@/components/CategoryBadge";
import type { EventRow } from "@/lib/events";
import { formatDate, formatPrice, formatShortDate, formatTime } from "@/lib/format";

export default function EventCard({ event }: { event: EventRow }): JSX.Element {
  const { month, day } = formatShortDate(event.starts_at);
  const seatsLeft = Math.max(0, event.capacity - event.seats_taken);
  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      <div className="relative">
        <EventBanner
          bannerUrl={event.banner_url}
          category={event.category}
          title={event.title}
          className="aspect-[16/9] w-full transition duration-300 group-hover:scale-[1.02]"
        />
        <CategoryBadge category={event.category} className="absolute left-3 top-3" />
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${
            event.price_cents ? "bg-text text-bg" : "bg-accent text-accentFg"
          }`}
        >
          {formatPrice(event.price_cents)}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 gap-4 p-4">
        <div className="flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-surface2 text-center">
          <span className="text-[10px] font-bold tracking-wider text-accent">{month}</span>
          <span className="font-display text-lg font-bold leading-none">{day}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 break-words font-display text-[16px] font-semibold leading-snug tracking-tight group-hover:text-accent">
            {event.title}
          </h3>
          <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[13px] text-textMuted">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              {formatDate(event.starts_at)} · {formatTime(event.starts_at)}
            </span>
          </p>
          <p className="mt-1 flex min-w-0 items-center gap-1.5 text-[13px] text-textMuted">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{event.location}</span>
          </p>
          <p className="mt-2 text-xs font-medium text-textMuted">
            {seatsLeft === 0 ? <span className="text-red-700">Sold out</span> : `${seatsLeft} seats left`}
          </p>
        </div>
      </div>
    </Link>
  );
}
