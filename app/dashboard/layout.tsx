import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Footer } from "@/components/Footer";
import { SubscriptionGate } from "@/components/SubscriptionGate";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background dashboard-grid">
      <DashboardNavbar />
      <main className="flex-1">
        <SubscriptionGate>{children}</SubscriptionGate>
      </main>
      <Footer />
    </div>
  );
}
