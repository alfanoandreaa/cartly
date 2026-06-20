import Link from "next/link";
import { Check } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignUpPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-16">
        <Logo />
        <div className="my-auto mx-auto w-full max-w-md py-12">
          <p className="text-sm font-semibold text-lime">START FOR FREE</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Give your wishlist a brain.</h1>
          <p className="mt-3 text-muted">Six picks are on us. No card, no pressure, no clutter.</p>
          <AuthForm mode="signup" />
          <p className="mt-7 text-center text-sm text-muted">
            Already have Cartly? <Link href="/auth/signin" className="font-semibold text-white hover:text-lime">Sign in</Link>
          </p>
        </div>
      </section>
      <aside className="hidden border-l border-line bg-surface p-12 lg:flex lg:flex-col lg:justify-center">
        <div className="mx-auto max-w-lg">
          <div className="rounded-[32px] border border-line bg-card p-8 shadow-card">
            <p className="text-sm font-semibold text-lime">FREE INCLUDES</p>
            <h2 className="mt-3 text-3xl font-bold">A calmer way to want things.</h2>
            <div className="mt-8 space-y-5">
              {["Six active product picks", "Three organized collections", "Daily price and stock checks", "Notes, tags, and priorities"].map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-lime text-ink">
                    <Check className="h-4 w-4" />
                  </span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}
