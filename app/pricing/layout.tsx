import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Heartbeat",
  description:
    "Simple, honest pricing for uptime monitoring. Pulse $9/mo (10 monitors), Vital $29/mo (50 monitors). 14-day free trial, no credit card required.",
  alternates: { canonical: "https://heartbeat.cool/pricing" },
};

const pricingJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Heartbeat Uptime Monitoring",
  description:
    "Set-and-forget uptime monitoring with beautiful status pages and real-time alerts.",
  brand: { "@type": "Organization", name: "Heartbeat" },
  offers: [
    {
      "@type": "Offer",
      name: "Pulse",
      price: "9.00",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        billingDuration: "P1M",
      },
      description:
        "10 monitors, 3-minute minimum interval, 1 status page, 30 days history, email notifications",
    },
    {
      "@type": "Offer",
      name: "Vital",
      price: "29.00",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        billingDuration: "P1M",
      },
      description:
        "50 monitors, 1-minute minimum interval, 5 status pages, 90 days history, webhooks + email",
    },
  ],
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }}
      />
      {children}
    </>
  );
}
