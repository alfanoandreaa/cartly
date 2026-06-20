"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <p className="text-5xl">🛒</p>
        <h1 className="mt-5 text-3xl font-bold">Cartly dropped the basket.</h1>
        <p className="mt-2 text-muted">A temporary error got in the way. Your picks are safe.</p>
        <Button onClick={reset} className="mt-6">Try again</Button>
      </div>
    </div>
  );
}
