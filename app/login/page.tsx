import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { authErrorMessage, isInviteToken, safeNext } from "@/lib/auth";
import { viewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Log in" };

export default async function Page({
  searchParams,
}: {
  searchParams: { error?: string; next?: string; invite?: string };
}): Promise<JSX.Element> {
  const next = safeNext(searchParams.next);
  const invite = isInviteToken(searchParams.invite) ? searchParams.invite : "";
  if (!invite && (await viewer())) redirect(next || "/events");
  return <AuthForm mode="login" error={authErrorMessage(searchParams.error)} next={next} invite={invite} />;
}
