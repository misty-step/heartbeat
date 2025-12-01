import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Heartbeat",
  description: "Privacy Policy for Heartbeat uptime monitoring service.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 px-6 sm:px-12 lg:px-24 py-16 sm:py-24">
        <article className="prose">
          <h1>Privacy Policy</h1>
          <p className="text-foreground/60">Last updated: November 29, 2025</p>

          <h2>1. Introduction</h2>
          <p>
            Misty Step ("we", "us", or "our") operates Heartbeat, an uptime monitoring service.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your
            information when you use our Service.
          </p>

          <h2>2. Information We Collect</h2>
          <p>We collect information that you provide directly to us:</p>
          <ul>
            <li>Account information (email address, name)</li>
            <li>Payment information (processed securely by our payment provider)</li>
            <li>Monitor configurations (URLs, check intervals, notification preferences)</li>
            <li>Communications with us (support requests, feedback)</li>
          </ul>
          <p>We automatically collect certain information:</p>
          <ul>
            <li>Log data (IP address, browser type, pages visited)</li>
            <li>Device information (operating system, device identifiers)</li>
            <li>Usage data (features used, actions taken)</li>
            <li>Monitoring data (response times, status codes from your monitored endpoints)</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <p>We use collected information to:</p>
          <ul>
            <li>Provide and maintain our Service</li>
            <li>Process transactions and send related information</li>
            <li>Send notifications about your monitored services</li>
            <li>Respond to your comments, questions, and support requests</li>
            <li>Monitor and analyze trends, usage, and activities</li>
            <li>Detect, investigate, and prevent fraudulent or unauthorized activities</li>
            <li>Improve our Service and develop new features</li>
          </ul>

          <h2>4. Information Sharing</h2>
          <p>We do not sell your personal information. We may share information with:</p>
          <ul>
            <li>Service providers who assist in operating our Service</li>
            <li>Professional advisors (lawyers, accountants) as needed</li>
            <li>Law enforcement when required by law or to protect our rights</li>
            <li>Other parties in connection with a merger, acquisition, or sale</li>
          </ul>

          <h2>5. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your
            information. However, no method of transmission over the Internet is 100% secure,
            and we cannot guarantee absolute security.
          </p>

          <h2>6. Data Retention</h2>
          <p>
            We retain your information for as long as your account is active or as needed to
            provide services. Monitoring data is retained for 90 days by default. You may
            request deletion of your data at any time.
          </p>

          <h2>7. Your Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul>
            <li>Access, update, or delete your personal information</li>
            <li>Object to or restrict processing of your information</li>
            <li>Data portability (receive your data in a structured format)</li>
            <li>Withdraw consent where processing is based on consent</li>
            <li>Lodge a complaint with a supervisory authority</li>
          </ul>

          <h2>8. Cookies and Tracking</h2>
          <p>
            We use essential cookies to operate our Service. We do not use tracking cookies
            or third-party analytics that follow you across websites. You can control cookies
            through your browser settings.
          </p>

          <h2>9. International Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your
            own. We ensure appropriate safeguards are in place for such transfers in compliance
            with applicable data protection laws.
          </p>

          <h2>10. Children's Privacy</h2>
          <p>
            Our Service is not intended for individuals under 16 years of age. We do not
            knowingly collect personal information from children. If we learn we have collected
            such information, we will delete it promptly.
          </p>

          <h2>11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any
            changes by posting the new policy on this page and updating the "Last updated" date.
          </p>

          <h2>12. Contact Us</h2>
          <p>
            For questions about this Privacy Policy or to exercise your rights, please contact
            us at <a href="mailto:hello@mistystep.io">hello@mistystep.io</a>.
          </p>
        </article>
      </main>

      {/* Footer */}
      <footer className="px-6 sm:px-12 lg:px-24 py-8 border-t border-foreground/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-foreground/50">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/" className="hover:text-foreground transition-colors">
              ← Back to home
            </Link>
          </div>
          <a
            href="https://mistystep.io"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            a misty step project →
          </a>
        </div>
      </footer>
    </div>
  );
}
