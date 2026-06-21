import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      plan: "FREE" | "PRO";
      accentColor?: string | null;
      locale?: string | null;
    };
  }

  interface User {
    plan?: "FREE" | "PRO";
    accentColor?: string | null;
    locale?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    plan?: "FREE" | "PRO";
    planSyncedAt?: number;
    accentColor?: string | null;
    locale?: string | null;
  }
}
