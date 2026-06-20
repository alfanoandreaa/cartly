import { discoverProducts } from "@/lib/demo-data";
import { Logo } from "@/components/brand/logo";

export default function AdminPage() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-line">
        <div className="container-page flex h-16 items-center justify-between"><Logo /><span className="rounded-full bg-coral/10 px-3 py-1 text-xs font-bold text-coral">ADMIN</span></div>
      </header>
      <div className="container-page py-10">
        <h1 className="text-4xl font-bold">Discover curation</h1>
        <p className="mt-2 text-muted">Seeded products currently available to Cartly Pro members.</p>
        <div className="mt-8 overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-card text-xs uppercase tracking-wider text-muted"><tr><th className="p-4">Product</th><th className="p-4">Category</th><th className="p-4">Price</th><th className="p-4">Saves</th></tr></thead>
            <tbody className="divide-y divide-line bg-surface">
              {discoverProducts.map((product) => (
                <tr key={product.id}><td className="p-4 font-medium">{product.title}<span className="ml-2 text-muted">· {product.siteName}</span></td><td className="p-4 text-muted">{product.category}</td><td className="p-4">€{product.price}</td><td className="p-4 text-muted">{product.saves}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
