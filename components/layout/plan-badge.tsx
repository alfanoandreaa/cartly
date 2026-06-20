import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function PlanBadge({ plan = "FREE", className }: { plan?: "FREE" | "PRO"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider",
        plan === "PRO" ? "bg-lime text-ink" : "bg-white/10 text-muted",
        className
      )}
    >
      {plan === "PRO" && <Sparkles className="h-3 w-3" />}
      {plan}
    </span>
  );
}
