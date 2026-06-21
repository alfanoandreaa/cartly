import { redirect } from "next/navigation";
import { LandingContent } from "@/components/landing/landing-content";
import { getSession } from "@/lib/auth";

export default async function LandingPage() {
  const session = await getSession();
  if (session?.user) redirect("/app/dashboard");
  return <LandingContent />;
}
