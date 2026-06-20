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
        plan: user.plan
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

export const authOptions: NextAuthOptions = {
  providers,
  session: { strategy: "jwt" },
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
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.plan = user.plan ?? "FREE";
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id ?? "demo-user";
      session.user.plan = token.plan ?? "FREE";
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
