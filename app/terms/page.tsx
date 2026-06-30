import { Shell } from "@/components/shared/shell";

export default function TermsPage() {
  return (
    <Shell footerLeft="Terms" footerRight="CapturePass">
      <section className="dashboard-wrap">
        <div className="dashboard-card" style={{ maxWidth: 760, margin: "0 auto" }}>
          <div className="dashboard-kicker">Legal</div>
          <h1>Terms of Service</h1>
          <p className="auth-message" style={{ marginBottom: 24 }}>
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="legal-content">
            <section>
              <h2>1. Scope</h2>
              <p>
                CapturePass is a sharing service that helps people share profiles,
                links, socials, content, bookings, business information, and contact details with NFC business cards and mobile QR codes.
              </p>
              <p>
                These Terms of Service govern account creation, purchases, profile sharing,
                card use, mobile QR use, and all other use of CapturePass.
              </p>
            </section>

            <section>
              <h2>2. Accounts and Eligibility</h2>
              <p>
                Using CapturePass account features requires an active account and, unless otherwise
                expressly granted by CapturePass, a paid subscription or approved exempt status.
              </p>
              <p>
                We may approve, deny, limit, or revoke account features where needed to operate
                the service, enforce these terms, or protect users and the platform.
              </p>
            </section>

            <section>
              <h2>3. Acceptable Use</h2>
              <p>
                CapturePass may be used to create and share a profile containing contact details,
                links, social handles, content, booking links, business information, and other
                information you choose to publish.
              </p>
              <p>You may not use CapturePass to:</p>
              <ul>
                <li>Impersonate another individual, organization, or public figure</li>
                <li>Publish unlawful, deceptive, abusive, harmful, or misleading material</li>
                <li>Probe, disrupt, exploit, or interfere with the service or its infrastructure</li>
                <li>Use the platform in a way that creates undue legal, operational, or reputational risk</li>
              </ul>
            </section>

            <section>
              <h2>4. Visibility and Sharing</h2>
              <p>
                CapturePass profiles and linked destinations are meant to be shared. If you publish a
                readable profile, the information on that profile may be visible to anyone who opens
                the link, taps a card, or scans a mobile QR code.
              </p>
              <p>
                You are solely responsible for the information you choose to make available.
              </p>
            </section>

            <section>
              <h2>5. Account Responsibility</h2>
              <p>
                You are responsible for maintaining accurate account information and for all activity associated
                with your account.
              </p>
              <p>
                You are also responsible for protecting your credentials and for notifying us if you believe your
                account has been compromised.
              </p>
            </section>

            <section>
              <h2>6. Payments and Subscription Terms</h2>
              <p>
                CapturePass is a paid service unless otherwise expressly designated as founder access,
                promotional access, lifetime access, or billing-exempt access.
              </p>
              <p>
                Payments are processed through Stripe or another approved payment provider. By purchasing access,
                you agree to the pricing, billing cadence, and payment terms presented at checkout, along with any
                applicable processor terms.
              </p>
            </section>

            <section>
              <h2>7. Service Changes</h2>
              <p>
                We may refine, modify, suspend, or discontinue any aspect of the service at any time. This includes
                changes to features, access levels, pricing, eligibility standards, and profile functionality.
              </p>
            </section>

            <section>
              <h2>8. Suspension and Termination</h2>
              <p>
                We reserve the right to suspend, restrict, disable, or terminate any account, profile, subscription,
                or access to the service at any time, with or without notice, and with or without providing a reason,
                in our sole discretion.
              </p>
              <p>
                We may also remove content, disable profile access, revoke features, or limit use of the service
                wherever we determine it is appropriate to protect the platform, its users, its operators, or its
                business interests.
              </p>
            </section>

            <section>
              <h2>9. Intellectual Property</h2>
              <p>
                CapturePass, including its design, branding, structure, interface, and service framework, is owned by
                its operator and protected under applicable intellectual property law. Your use of the service does not
                transfer any ownership rights in the platform or its underlying assets.
              </p>
            </section>

            <section>
              <h2>10. Disclaimer</h2>
              <p>
                CapturePass is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis, without warranties of any
                kind, whether express or implied. We do not guarantee uninterrupted availability, error-free operation,
                or suitability for any particular purpose.
              </p>
            </section>

            <section>
              <h2>11. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, CapturePass shall not be liable for any indirect, incidental,
                consequential, special, exemplary, or punitive damages, or for any loss of data, business, revenue,
                reputation, or opportunity arising from or related to use of the service.
              </p>
            </section>

            <section>
              <h2>12. Changes to These Terms</h2>
              <p>
                We may revise these terms from time to time. Continued use of CapturePass after revised terms become
                effective constitutes acceptance of those updates.
              </p>
            </section>

            <section>
              <h2>13. Contact</h2>
              <p>
                For questions regarding these terms, contact{" "}
                <a href="mailto:support@capturepass.com">support@capturepass.com</a>.
              </p>
            </section>
          </div>
        </div>
      </section>
    </Shell>
  );
}
