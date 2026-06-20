import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SharedNotFound() {
  return (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <p className="text-6xl">🔗</p>
        <h1 className="mt-5 text-3xl font-bold">This shared link has wandered off.</h1>
        <p className="mt-2 text-muted">The owner may have disabled it.</p>
        <Button asChild className="mt-6"><Link href="/">Meet Cartly</Link></Button>
      </div>
    </div>
  );
}
