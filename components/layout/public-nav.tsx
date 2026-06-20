import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export function PublicNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-ink/80 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
          <Link className="transition hover:text-white" href="/#features">
            Features
          </Link>
          <Link className="transition hover:text-white" href="/#how-it-works">
            How it works
          </Link>
          <Link className="transition hover:text-white" href="/pricing">
            Pricing
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/auth/signin">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/auth/signup">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
