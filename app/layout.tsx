import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Heartbeat - Set and forget uptime monitoring",
  description: "Beautiful status pages and reliable uptime monitoring for indie hackers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
