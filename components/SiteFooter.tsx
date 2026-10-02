import Link from "next/link";
import { Logo } from "@/components/SiteHeader";
import { CATEGORIES } from "@/lib/categories";

export default function SiteFooter(): JSX.Element {
  return (
    <footer className="mt-24 border-t border-border bg-surface py-12 text-textMuted">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 text-sm">Discover what is happening near you, save your seat in seconds, and host events people remember.</p>
        </div>
        <FooterCol title="Explore">
          <Link href="/events">All events</Link>
          <Link href="/events?when=week">This week</Link>
          <Link href="/events?when=month">This month</Link>
        </FooterCol>
        <FooterCol title="Categories">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} href={`/events?category=${c.slug}`}>
              {c.label}
            </Link>
          ))}
        </FooterCol>
        <FooterCol title="Your account">
          <Link href="/events/new">Create event</Link>
          <Link href="/my-events">My events</Link>
          <Link href="/my-registrations">My registrations</Link>
          <Link href="/profile">Profile</Link>
        </FooterCol>
      </div>
      <div className="mx-auto mt-10 flex max-w-6xl flex-col gap-2 border-t border-border px-4 pt-6 text-xs sm:flex-row sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} Evently. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="#" className="hover:text-text">Privacy</Link>
          <Link href="#" className="hover:text-text">Terms</Link>
          <Link href="#" className="hover:text-text">Contact</Link>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <div>
      <h4 className="text-sm font-semibold text-text">{title}</h4>
      <div className="mt-3 flex flex-col gap-2 text-sm [&>a:hover]:text-text [&>a]:transition">{children}</div>
    </div>
  );
}
