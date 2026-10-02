import type { Metadata } from "next";
import Avatar from "@/components/Avatar";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import ImageUploadField from "@/components/ImageUploadField";
import { requireUserPage } from "@/lib/auth";
import { removeSampleDataAction, updateProfileAction } from "@/lib/event-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Profile" };

const ERRORS: Record<string, string> = {
  name: "Your name cannot be empty.",
  avatar: "Profile image must be an uploaded image or an https:// link.",
  upload_size: "That image is over 3 MB. Choose a smaller file.",
  upload_type: "Profile images must be JPG, PNG, WebP or GIF.",
};

const inputCls =
  "h-11 w-full min-w-0 rounded-xl border border-border bg-bg px-3 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { saved?: string; error?: string; samples?: string };
}): Promise<JSX.Element> {
  const user = await requireUserPage("/profile");
  const error = typeof searchParams.error === "string" ? ERRORS[searchParams.error] ?? null : null;
  const notice = searchParams.saved ? "Profile updated." : searchParams.samples === "removed" ? "Sample events removed." : null;
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="animate-fade-in-up flex items-center gap-4">
        <Avatar name={user.name || user.email} url={user.avatar_url} className="h-16 w-16 text-xl" />
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-bold tracking-tight">{user.name || "Your profile"}</h1>
          <p className="truncate text-textMuted">{user.email}</p>
        </div>
      </div>
      {notice ? <p className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-200">{notice}</p> : null}
      {error ? <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">{error}</p> : null}

      <form action={updateProfileAction} className="mt-8 grid gap-4 rounded-2xl border border-border bg-surface p-6 shadow-card">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Full name</span>
          <input name="name" required maxLength={80} defaultValue={user.name} className={inputCls} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Email</span>
          <input value={user.email} readOnly disabled className={`${inputCls} cursor-not-allowed text-textMuted`} />
        </label>
        <ImageUploadField
          fileName="avatar_file"
          urlName="avatar_url"
          defaultUrl={user.avatar_url ?? ""}
          label="Profile image (optional)"
          hint="JPG, PNG, WebP or GIF up to 3 MB."
          round
        />
        <div className="flex justify-end">
          <button className="h-11 rounded-xl bg-accent px-5 text-sm font-semibold text-accentFg shadow-sm transition hover:brightness-110">Save changes</button>
        </div>
      </form>

      {user.role === "admin" ? (
        <section className="mt-8 rounded-2xl border border-border bg-surface p-6 shadow-card">
          <h2 className="text-lg font-semibold tracking-tight">Sample data</h2>
          <p className="mt-1 text-sm text-textMuted">
            Evently launched with demo events so the site looks alive. Remove them once your own events are published. Your real events and registrations are not touched.
          </p>
          <form action={removeSampleDataAction} className="mt-4">
            <ConfirmSubmit
              message="Remove all sample events? This cannot be undone."
              className="h-10 rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              Remove sample data
            </ConfirmSubmit>
          </form>
        </section>
      ) : null}
    </main>
  );
}
