import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Email and password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials) {
      const parsed = z
        .object({ email: z.string().email(), password: z.string().min(6) })
        .safeParse(credentials);

      if (!parsed.success) return null;

      if (!process.env.DATABASE_URL) {
        return {
          id: "demo-user",
          email: parsed.data.email,
          name: "Alex Morgan",
          plan: parsed.data.email.toLowerCase().includes("pro") ? "PRO" : "FREE"
        };
      }

      const user = await prisma.user.findUnique({
        where: { email: parsed.data.email.toLowerCase() }
      });

      if (!user?.passwordHash || !(await compare(parsed.data.password, user.passwordHash))) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        plan: user.plan,
        accentColor: user.accentColor,
        locale: user.locale
      };
    }
  })
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    })
  );
}

// Keep people signed in for a month, refreshed on every visit, so closing the
// browser and coming back days later never loses the account.
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const PLAN_REFRESH_INTERVAL = 5 * 60 * 1000; // re-read plan from DB every 5 min

export const authOptions: NextAuthOptions = {
  providers,
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
    updateAge: 60 * 60 * 24 // slide the expiry forward at most once a day
  },
  jwt: { maxAge: SESSION_MAX_AGE },
  pages: { signIn: "/auth/signin" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.email || !process.env.DATABASE_URL) return true;
      const dbUser = await prisma.user.upsert({
        where: { email: user.email.toLowerCase() },
        update: { name: user.name, image: user.image },
        create: { email: user.email.toLowerCase(), name: user.name, image: user.image }
      });
      user.id = dbUser.id;
      user.plan = dbUser.plan;
      user.accentColor = dbUser.accentColor;
      user.locale = dbUser.locale;
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.plan = user.plan ?? "FREE";
        token.accentColor = user.accentColor ?? null;
        token.locale = user.locale ?? null;
        token.planSyncedAt = Date.now();
        return token;
      }

      // On later requests, refresh the plan/name from the database periodically
      // (and immediately when the client calls update()), so a Pro upgrade or a
      // profile edit is reflected without forcing a fresh login.
      const stale =
        trigger === "update" ||
        typeof token.planSyncedAt !== "number" ||
        Date.now() - token.planSyncedAt > PLAN_REFRESH_INTERVAL;
      if (process.env.DATABASE_URL && token.id && token.id !== "demo-user" && stale) {
        const dbUser = await prisma.user
          .findUnique({
            where: { id: token.id },
            select: { plan: true, name: true, accentColor: true, locale: true }
          })
          .catch(() => null);
        if (dbUser) {
          token.plan = dbUser.plan;
          token.name = dbUser.name;
          token.accentColor = dbUser.accentColor;
          token.locale = dbUser.locale;
          token.planSyncedAt = Date.now();
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id ?? "demo-user";
      session.user.plan = token.plan ?? "FREE";
      session.user.accentColor = token.accentColor ?? null;
      session.user.locale = token.locale ?? null;
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET ?? "cartly-local-development-secret"
};

export function getSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return (
    session?.user ?? {
      id: "demo-user",
      email: "hello@cartly.app",
      name: "Alex Morgan",
      image: null,
      plan: "FREE" as const
    }
  );
}
