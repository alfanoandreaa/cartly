import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Inline SVG flags. Emoji flags (🇮🇹 …) don't render on Windows, which falls
// back to the two-letter code, so we draw them ourselves for consistency.
const flags: Record<Locale, React.ReactNode> = {
  en: (
    <>
      <rect width="20" height="14" fill="#012169" />
      <path d="M0 0l20 14M20 0L0 14" stroke="#fff" strokeWidth="2.4" />
      <path d="M0 0l20 14M20 0L0 14" stroke="#C8102E" strokeWidth="1.2" />
      <path d="M10 0v14M0 7h20" stroke="#fff" strokeWidth="3.6" />
      <path d="M10 0v14M0 7h20" stroke="#C8102E" strokeWidth="2" />
    </>
  ),
  it: (
    <>
      <rect width="6.67" height="14" fill="#008C45" />
      <rect x="6.67" width="6.66" height="14" fill="#fff" />
      <rect x="13.33" width="6.67" height="14" fill="#CD212A" />
    </>
  ),
  es: (
    <>
      <rect width="20" height="14" fill="#AA151B" />
      <rect y="3.5" width="20" height="7" fill="#F1BF00" />
    </>
  ),
  fr: (
    <>
      <rect width="6.67" height="14" fill="#0055A4" />
      <rect x="6.67" width="6.66" height="14" fill="#fff" />
      <rect x="13.33" width="6.67" height="14" fill="#EF4135" />
    </>
  ),
  de: (
    <>
      <rect width="20" height="4.67" fill="#000" />
      <rect y="4.67" width="20" height="4.66" fill="#DD0000" />
      <rect y="9.33" width="20" height="4.67" fill="#FFCE00" />
    </>
  ),
  pt: (
    <>
      <rect width="20" height="14" fill="#DA291C" />
      <rect width="8" height="14" fill="#046A38" />
      <circle cx="8" cy="7" r="2.6" fill="#FFE000" stroke="#fff" strokeWidth="0.5" />
    </>
  )
};

export function Flag({ code, className }: { code: Locale; className?: string }) {
  return (
    <svg
      viewBox="0 0 20 14"
      className={cn("h-3.5 w-5 shrink-0 rounded-[2px]", className)}
      role="img"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      {flags[code] ?? flags.en}
    </svg>
  );
}
