import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Heartbeat",
  description: "Terms of Service for Heartbeat uptime monitoring service.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 px-6 sm:px-12 lg:px-24 py-16 sm:py-24">
        <article className="prose">
          <h1>Terms of Service</h1>
          <p className="text-foreground/60">Last updated: November 29, 2025</p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using Heartbeat ("Service"), operated by Misty Step ("we", "us", or "our"),
            you agree to be bound by these Terms of Service. If you do not agree to these terms,
            please do not use our Service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            Heartbeat provides uptime monitoring and status page services for websites, APIs, and
            other internet-accessible services. We monitor your endpoints at regular intervals and
            notify you when issues are detected.
          </p>

          <h2>3. User Accounts</h2>
          <p>
            To use certain features of the Service, you must create an account. You are responsible for:
          </p>
          <ul>
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately of any unauthorized access</li>
          </ul>

          <h2>4. Acceptable Use</h2>
          <p>You agree not to use the Service to:</p>
          <ul>
            <li>Monitor endpoints you do not own or have permission to monitor</li>
            <li>Conduct denial-of-service attacks or other malicious activities</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe upon the rights of others</li>
            <li>Transmit malware, spam, or other harmful content</li>
          </ul>

          <h2>5. Service Availability</h2>
          <p>
            We strive to maintain high availability of our Service, but we do not guarantee
            uninterrupted access. We may temporarily suspend the Service for maintenance,
            updates, or circumstances beyond our control.
          </p>

          <h2>6. Payment and Billing</h2>
          <p>
            Paid plans are billed in advance on a monthly or annual basis. All fees are
            non-refundable except as required by law. We reserve the right to change our
            pricing with 30 days notice.
          </p>

          <h2>7. Intellectual Property</h2>
          <p>
            The Service and its original content, features, and functionality are owned by
            Misty Step and are protected by international copyright, trademark, and other
            intellectual property laws.
          </p>

          <h2>8. Disclaimer of Warranties</h2>
          <p>
            The Service is provided "as is" and "as available" without warranties of any kind,
            either express or implied. We do not warrant that the Service will be error-free,
            secure, or uninterrupted.
          </p>

          <h2>9. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Misty Step shall not be liable for any
            indirect, incidental, special, consequential, or punitive damages, including
            loss of profits, data, or business opportunities.
          </p>

          <h2>10. Termination</h2>
          <p>
            We may terminate or suspend your account at any time for violations of these terms.
            You may terminate your account at any time by contacting us. Upon termination,
            your right to use the Service will cease immediately.
          </p>

          <h2>11. Changes to Terms</h2>
          <p>
            We may modify these terms at any time. We will notify you of significant changes
            via email or through the Service. Continued use after changes constitutes acceptance.
          </p>

          <h2>12. Governing Law</h2>
          <p>
            These terms shall be governed by and construed in accordance with the laws of the
            State of Delaware, United States, without regard to conflict of law provisions.
          </p>

          <h2>13. Contact</h2>
          <p>
            For questions about these Terms of Service, please contact us at{" "}
            <a href="mailto:hello@mistystep.io">hello@mistystep.io</a>.
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
