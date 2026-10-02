"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser, requireAdminAction } from "@/lib/auth";
import { isCategory } from "@/lib/categories";
import { createEvent, deleteEvent, removeSampleEvents, updateEvent, type EventInput } from "@/lib/events";
import { query } from "@/lib/db";
import { normalizeImageUrl, saveUploadedImage } from "@/lib/images";

type Parsed = { ok: true; input: EventInput } | { ok: false; error: string };

function parseEventForm(formData: FormData): Parsed {
  const title = String(formData.get("title") ?? "").trim().slice(0, 140);
  const bannerRaw = String(formData.get("banner_url") ?? "").trim().slice(0, 1000);
  const category = String(formData.get("category") ?? "");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const location = String(formData.get("location") ?? "").trim().slice(0, 200);
  const description = String(formData.get("description") ?? "").trim().slice(0, 5000);
  const capacity = Number(formData.get("capacity"));
  const priceRaw = String(formData.get("price") ?? "").trim();
  const price = priceRaw === "" ? 0 : Number(priceRaw);
  const status = formData.get("intent") === "publish" ? "published" : "draft";

  if (!title) return { ok: false, error: "title" };
  if (!isCategory(category)) return { ok: false, error: "category" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return { ok: false, error: "datetime" };
  const startsAt = new Date(`${date}T${time}:00Z`);
  if (Number.isNaN(startsAt.getTime())) return { ok: false, error: "datetime" };
  if (!location) return { ok: false, error: "location" };
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100000) return { ok: false, error: "capacity" };
  if (!Number.isFinite(price) || price < 0 || price > 100000) return { ok: false, error: "price" };
  const banner_url = normalizeImageUrl(bannerRaw);
  if (banner_url === false) return { ok: false, error: "banner" };
  return {
    ok: true,
    input: {
      title,
      banner_url,
      category,
      starts_at: startsAt.toISOString(),
      location,
      description,
      capacity,
      price_cents: Math.round(price * 100),
      status,
    },
  };
}

/** Create (no event_id) or update (event_id owned by the caller) an event. */
export async function saveEventAction(formData: FormData): Promise<void> {
  const user = await currentUser();
  if (!user) redirect("/login?next=%2Fevents%2Fnew");
  const eventId = Number(formData.get("event_id") ?? 0);
  const formPath = eventId ? `/events/${eventId}/edit` : "/events/new";
  const parsed = parseEventForm(formData);
  if (!parsed.ok) redirect(`${formPath}?error=${parsed.error}`);

  let targetId = eventId;
  try {
    const upload = await saveUploadedImage(formData.get("banner_file"), user.id);
    if (!upload.ok) redirect(`${formPath}?error=${upload.error === "too_big" ? "upload_size" : "upload_type"}`);
    if (upload.url) parsed.input.banner_url = upload.url;
    if (eventId) {
      if (!(await updateEvent(eventId, user.id, parsed.input))) redirect("/my-events");
    } else {
      targetId = await createEvent(user.id, parsed.input);
    }
  } catch (e) {
    if ((e as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    console.error("[event] save failed", (e as { code?: string })?.code ?? "unknown");
    redirect(`${formPath}?error=server`);
  }
  revalidatePath("/events");
  revalidatePath("/");
  redirect(parsed.input.status === "published" ? `/events/${targetId}` : "/my-events?saved=draft");
}

export async function deleteEventAction(formData: FormData): Promise<void> {
  const user = await currentUser();
  if (!user) redirect("/login?next=%2Fmy-events");
  const eventId = Number(formData.get("event_id"));
  if (Number.isInteger(eventId) && eventId > 0) {
    await deleteEvent(eventId, user.id);
  }
  revalidatePath("/my-events");
  revalidatePath("/events");
  redirect("/my-events?deleted=1");
}

/** Site owner only: remove the seeded demo events so real ones take their place. */
export async function removeSampleDataAction(): Promise<void> {
  await requireAdminAction();
  await removeSampleEvents();
  revalidatePath("/");
  revalidatePath("/events");
  redirect("/profile?samples=removed");
}

export async function updateProfileAction(formData: FormData): Promise<void> {
  const user = await currentUser();
  if (!user) redirect("/login?next=%2Fprofile");
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const avatarRaw = String(formData.get("avatar_url") ?? "").trim().slice(0, 1000);
  if (!name) redirect("/profile?error=name");
  let avatar = normalizeImageUrl(avatarRaw);
  if (avatar === false) redirect("/profile?error=avatar");
  const upload = await saveUploadedImage(formData.get("avatar_file"), user.id);
  if (!upload.ok) redirect(`/profile?error=${upload.error === "too_big" ? "upload_size" : "upload_type"}`);
  if (upload.url) avatar = upload.url;
  await query("UPDATE users SET name = $2, avatar_url = $3 WHERE id = $1", [user.id, name, avatar]);
  revalidatePath("/", "layout");
  redirect("/profile?saved=1");
}
