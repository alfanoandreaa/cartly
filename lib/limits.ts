import type { Plan } from "@prisma/client";

export const PLAN_LIMITS = {
  FREE: {
    products: 10,
    collections: 3,
    sharing: false,
    alerts: false,
    discover: false,
    refreshHours: 24
  },
  PRO: {
    products: 20,
    collections: Number.POSITIVE_INFINITY,
    sharing: true,
    alerts: true,
    discover: true,
    refreshHours: 6
  }
} as const;

export function limitsFor(plan: Plan | "FREE" | "PRO") {
  return PLAN_LIMITS[plan];
}

export function productLimitState(plan: Plan | "FREE" | "PRO", count: number) {
  const max = limitsFor(plan).products;
  return {
    blocked: plan === "FREE" && count >= max,
    warning: plan === "PRO" && count >= max,
    max
  };
}
