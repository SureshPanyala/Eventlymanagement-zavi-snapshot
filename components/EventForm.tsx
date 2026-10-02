import { CalendarDays, ImageIcon, MapPin, Send, Save, Users } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { saveEventAction } from "@/lib/event-actions";
import ImageUploadField from "@/components/ImageUploadField";

export type EventFormValues = {
  id?: number;
  title: string;
  banner_url: string;
  category: string;
  date: string;
  time: string;
  location: string;
  description: string;
  capacity: string;
  price: string;
  status?: "draft" | "published";
};

export const EVENT_FORM_ERRORS: Record<string, string> = {
  title: "Give your event a name.",
  category: "Choose a category.",
  datetime: "Pick a valid date and start time.",
  location: "Add a location or venue.",
  capacity: "Maximum attendees must be a whole number between 1 and 100,000.",
  price: "Price must be 0 or a positive amount.",
  banner: "Banner image must be an uploaded image or an https:// link.",
  upload_size: "That banner image is over 3 MB. Choose a smaller file.",
  upload_type: "Banner images must be JPG, PNG, WebP or GIF.",
  server: "Something went wrong saving your event. Try again.",
};

const inputCls =
  "h-11 w-full min-w-0 rounded-xl border border-border bg-bg px-3 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";

export default function EventForm({ values, error }: { values: EventFormValues; error: string | null }): JSX.Element {
  return (
    <form action={saveEventAction} className="grid gap-6">
      {values.id ? <input type="hidden" name="event_id" value={values.id} /> : null}
      {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">{error}</p> : null}

      <Section title="Basics" icon={<CalendarDays className="h-4 w-4" />}>
        <Label text="Event name">
          <input name="title" required maxLength={140} defaultValue={values.title} placeholder="e.g. Product Design Meetup" className={inputCls} />
        </Label>
        <div className="grid gap-4 sm:grid-cols-3">
          <Label text="Category">
            <select name="category" required defaultValue={values.category} className={inputCls}>
              <option value="" disabled>Choose…</option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>{c.label}</option>
              ))}
            </select>
          </Label>
          <Label text="Date">
            <input name="date" type="date" required defaultValue={values.date} className={inputCls} />
          </Label>
          <Label text="Start time">
            <input name="time" type="time" required defaultValue={values.time} className={inputCls} />
          </Label>
        </div>
      </Section>

      <Section title="Where and how many" icon={<MapPin className="h-4 w-4" />}>
        <Label text="Location">
          <input name="location" required maxLength={200} defaultValue={values.location} placeholder="Venue, street, city" className={inputCls} />
        </Label>
        <div className="grid gap-4 sm:grid-cols-2">
          <Label text="Maximum attendees">
            <input name="capacity" type="number" min={1} max={100000} required defaultValue={values.capacity} className={inputCls} />
          </Label>
          <Label text="Price (USD, leave 0 for free)">
            <input name="price" type="number" min={0} step="0.01" defaultValue={values.price} className={inputCls} />
          </Label>
        </div>
      </Section>

      <Section title="Details" icon={<ImageIcon className="h-4 w-4" />}>
        <ImageUploadField
          fileName="banner_file"
          urlName="banner_url"
          defaultUrl={values.banner_url}
          label="Banner image (optional)"
          hint="JPG, PNG, WebP or GIF up to 3 MB, wide images look best. Leave empty for a banner in your category colors."
        />
        <Label text="Description">
          <textarea
            name="description"
            rows={6}
            maxLength={5000}
            defaultValue={values.description}
            placeholder="What will attendees experience? Who is it for?"
            className="w-full min-w-0 rounded-xl border border-border bg-bg px-3 py-2.5 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </Label>
      </Section>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
        <button name="intent" value="draft" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-6 text-[15px] font-semibold transition hover:bg-surface2">
          <Save className="h-4 w-4" /> Save draft
        </button>
        <button name="intent" value="publish" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-[15px] font-semibold text-accentFg shadow-sm transition hover:brightness-110">
          <Send className="h-4 w-4" /> {values.status === "published" ? "Update and keep published" : "Publish event"}
        </button>
      </div>
      <p className="-mt-3 flex items-center justify-end gap-1.5 text-xs text-textMuted">
        <Users className="h-3.5 w-3.5" /> Published events appear on the Events page right away.
      </p>
    </form>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }): JSX.Element {
  return (
    <fieldset className="grid gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
      <legend className="sr-only">{title}</legend>
      <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">{icon}</span>
        {title}
      </h2>
      {children}
    </fieldset>
  );
}

function Label({ text, children }: { text: string; children: React.ReactNode }): JSX.Element {
  return (
    <label className="grid min-w-0 gap-1.5">
      <span className="text-sm font-medium">{text}</span>
      {children}
    </label>
  );
}
