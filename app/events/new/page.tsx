import type { Metadata } from "next";
import EventForm, { EVENT_FORM_ERRORS } from "@/components/EventForm";
import { requireUserPage } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Create event" };

export default async function NewEventPage({ searchParams }: { searchParams: { error?: string } }): Promise<JSX.Element> {
  await requireUserPage("/events/new");
  const error = typeof searchParams.error === "string" ? EVENT_FORM_ERRORS[searchParams.error] ?? null : null;
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="animate-fade-in-up">
        <h1 className="text-4xl font-bold tracking-tight">Create an event</h1>
        <p className="mt-2 text-textMuted">Save a draft while you work, then publish it when it is ready.</p>
      </div>
      <div className="mt-8">
        <EventForm
          error={error}
          values={{ title: "", banner_url: "", category: "", date: "", time: "18:00", location: "", description: "", capacity: "100", price: "0" }}
        />
      </div>
    </main>
  );
}
