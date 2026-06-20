import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  compact = false,
  href = "/"
}: {
  className?: string;
  compact?: boolean;
  href?: string;
}) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 font-bold tracking-[-0.04em]", className)}>
      <span className="relative grid h-8 w-8 place-items-center rounded-[10px] bg-lime text-ink shadow-glow">
        <span className="text-lg font-black">C</span>
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-ink bg-coral" />
      </span>
      {!compact && <span className="text-xl">Cartly</span>}
    </Link>
  );
}
