import { Shell } from "@/components/shared/shell";

export default function TermsPage() {
  return (
    <Shell footerLeft="Terms" footerRight="Signal Pass">
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
                Signal Pass is a private-access profile service built for cleaner introductions,
                more direct follow-up, and greater control over how you are encountered online.
              </p>
              <p>
                These Terms of Service govern all access to and use of Signal Pass. By creating an
                account, purchasing access, or using the service in any way, you agree to these terms.
              </p>
            </section>

            <section>
              <h2>2. Access and Eligibility</h2>
              <p>
                Access to Signal Pass requires an active account and, unless otherwise expressly granted
                by Signal Pass, a paid subscription or approved exempt status.
              </p>
              <p>
                Access is offered at our discretion. We may approve, deny, limit, or revoke access at
                any time.
              </p>
            </section>

            <section>
              <h2>3. Acceptable Use</h2>
              <p>
                Signal Pass may be used to create and share a profile containing contact details, links,
                positioning language, and other information you choose to publish.
              </p>
              <p>You may not use Signal Pass to:</p>
              <ul>
                <li>Impersonate another individual, organization, or public figure</li>
                <li>Publish unlawful, deceptive, abusive, harmful, or misleading material</li>
                <li>Probe, disrupt, exploit, or interfere with the service or its infrastructure</li>
                <li>Use the platform in a way that creates undue legal, operational, or reputational risk</li>
              </ul>
            </section>

            <section>
              <h2>4. Visibility and Profile Sharing</h2>
              <p>
                Signal Pass supports both readable and anonymized access patterns. If you publish a readable
                profile, the information on that profile may be visible to anyone who opens the link.
              </p>
              <p>
                You are solely responsible for the information you choose to make available through your profile.
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
                Signal Pass is a paid service unless otherwise expressly designated as founder access,
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
                Signal Pass, including its design, branding, structure, interface, and service framework, is owned by
                its operator and protected under applicable intellectual property law. Your use of the service does not
                transfer any ownership rights in the platform or its underlying assets.
              </p>
            </section>

            <section>
              <h2>10. Disclaimer</h2>
              <p>
                Signal Pass is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis, without warranties of any
                kind, whether express or implied. We do not guarantee uninterrupted availability, error-free operation,
                or suitability for any particular purpose.
              </p>
            </section>

            <section>
              <h2>11. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, Signal Pass shall not be liable for any indirect, incidental,
                consequential, special, exemplary, or punitive damages, or for any loss of data, business, revenue,
                reputation, or opportunity arising from or related to use of the service.
              </p>
            </section>

            <section>
              <h2>12. Changes to These Terms</h2>
              <p>
                We may revise these terms from time to time. Continued use of Signal Pass after revised terms become
                effective constitutes acceptance of those updates.
              </p>
            </section>

            <section>
              <h2>13. Contact</h2>
              <p>
                For questions regarding these terms, contact{" "}
                <a href="mailto:john@signalrefinery.pro">john@signalrefinery.pro</a>.
              </p>
            </section>
          </div>
        </div>
      </section>
    </Shell>
  );
}