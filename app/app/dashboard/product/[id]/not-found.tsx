import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <div className="grid min-h-[70vh] place-items-center p-6 text-center">
      <div>
        <p className="text-6xl">🫥</p>
        <h1 className="mt-5 text-3xl font-bold">That pick slipped away.</h1>
        <p className="mt-2 text-muted">It may have been deleted or moved.</p>
        <Button asChild className="mt-6"><Link href="/app/dashboard">Back to your picks</Link></Button>
      </div>
    </div>
  );
}
