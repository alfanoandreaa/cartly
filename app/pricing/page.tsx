import { PublicNav } from "@/components/layout/public-nav";
import { PricingCards } from "@/components/pricing/pricing-cards";

const faqs = [
  ["Can I cancel Cartly Pro anytime?", "Yes. Your plan stays active until the end of the current billing period, then returns to Free."],
  ["What happens to picks over the Free limit?", "Nothing is deleted. They stay visible, but you’ll need to remove items before adding new ones."],
  ["Which stores does Cartly support?", "Cartly works with most public product pages. Some stores may limit automated price checks."],
  ["How often are prices checked?", "Free picks refresh every 24 hours. Cartly Pro picks get priority checks every 6 hours."],
  ["Do you sell my shopping data?", "No. Cartly’s business is the subscription, not your attention or shopping history."]
];

export default function PricingPage() {
  return (
    <main>
      <PublicNav />
      <section className="container-page py-20 text-center sm:py-28">
        <p className="text-sm font-bold uppercase tracking-[.2em] text-lime">Pricing</p>
        <h1 className="text-balance mx-auto mt-4 max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl">
          Spend less on the wrong things.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">Start free and upgrade when your wishlist starts earning its keep.</p>
        <div className="mt-14 text-left">
          <PricingCards />
        </div>
      </section>
      <section className="border-t border-line bg-surface/40 py-20">
        <div className="container-page mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold">Questions, answered.</h2>
          <div className="mt-10 divide-y divide-line border-y border-line">
            {faqs.map(([question, answer]) => (
              <details key={question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-semibold">
                  {question}
                  <span className="text-2xl font-light text-lime transition group-open:rotate-45">+</span>
                </summary>
                <p className="max-w-2xl pt-3 leading-relaxed text-muted">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
