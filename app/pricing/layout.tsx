import type { Metadata } from "next";
import { safeJsonLd } from "@/lib/json-ld";
import { BASE_URL } from "@/lib/constants";
import { TIERS } from "@/lib/tiers";

export const metadata: Metadata = {
  title: "Pricing — Heartbeat",
  description:
    "Simple, honest pricing for uptime monitoring. Pulse $9/mo (10 monitors), Vital $29/mo (50 monitors). 14-day free trial, no credit card required.",
  alternates: { canonical: `${BASE_URL}/pricing` },
};

const pricingJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Heartbeat Uptime Monitoring",
  description:
    "Set-and-forget uptime monitoring with beautiful status pages and real-time alerts.",
  brand: { "@type": "Organization", name: "Heartbeat" },
  offers: Object.values(TIERS).map((tier) => ({
    "@type": "Offer",
    name: tier.name,
    price: (tier.monthlyPrice / 100).toFixed(2),
    priceCurrency: "USD",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      billingDuration: "P1M",
    },
    description: `${tier.monitors} monitors, ${Math.floor(tier.minInterval / 60)}-minute intervals, ${tier.statusPages} status page${tier.statusPages > 1 ? "s" : ""}, ${tier.historyDays}-day history${tier.webhooks ? ", webhooks" : ""}`,
  })),
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(pricingJsonLd) }}
      />
      {children}
    </>
  );
}
