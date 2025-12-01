import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Footer } from "@/components/Footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background dashboard-grid">
      <DashboardNavbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
