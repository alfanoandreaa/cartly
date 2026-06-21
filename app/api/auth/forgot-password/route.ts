import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { sendCartlyEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({ email: z.string().email() });

// Generic response — never reveals whether an email is registered.
const GENERIC_OK = {
  ok: true,
  message: "If that email has a Cartly account, a reset link is on its way."
};

export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const limit = rateLimit(`forgot:${forwarded ?? "local"}`, 3, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute and try again." },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } }
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }

  // No database (demo mode) — nothing to reset, but keep the response generic.
  if (!process.env.DATABASE_URL) return NextResponse.json(GENERIC_OK);

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true }
  });

  // Only send a link to accounts that actually have a password set.
  if (user?.passwordHash) {
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate any earlier outstanding tokens, then store the new one.
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt }
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const resetUrl = `${appUrl}/auth/reset-password?token=${rawToken}`;

    try {
      await sendCartlyEmail({
        to: email,
        subject: "Reset your Cartly password",
        title: "Let’s get you back in",
        body: "We received a request to reset your Cartly password. This link expires in 1 hour. If you didn’t ask for this, you can safely ignore this email.",
        cta: { label: "Reset my password", href: resetUrl }
      });
    } catch (error) {
      console.error("Cartly password reset email failed", error);
    }
  }

  return NextResponse.json(GENERIC_OK);
}
