import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      plan: "FREE" | "PRO";
    };
  }

  interface User {
    plan?: "FREE" | "PRO";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    plan?: "FREE" | "PRO";
    planSyncedAt?: number;
  }
}
