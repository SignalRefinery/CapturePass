import { Shell } from "@/components/shared/shell";

export default function PrivacyPage() {
  return (
    <Shell footerLeft="Privacy" footerRight="Signal Pass">
      <section className="dashboard-wrap">
        <div className="dashboard-card" style={{ maxWidth: 760, margin: "0 auto" }}>
          <div className="dashboard-kicker">Legal</div>
          <h1>Privacy Policy</h1>
          <p className="auth-message" style={{ marginBottom: 24 }}>
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="legal-content">
            <section>
              <h2>1. Scope</h2>
              <p>
                Signal Pass is designed to help you present yourself more clearly, share information
                more intentionally, and control how others encounter you through direct access.
              </p>
              <p>
                This Privacy Policy explains what information we collect, how it is used, and how
                profile visibility works within Signal Pass.
              </p>
            </section>

            <section>
              <h2>2. Information You Provide</h2>
              <p>
                When you use Signal Pass, you may provide information such as your name, email address,
                phone number, profile content, role line, website, links, and other details you choose
                to publish or store in your account.
              </p>
              <p>
                If you make a purchase, payment information is processed by Stripe or another approved
                payment provider. Signal Pass does not store full payment card details.
              </p>
            </section>

            <section>
              <h2>3. How Information Is Used</h2>
              <p>
                We use your information to operate the service, maintain your account, present your
                profile according to your settings, process billing, support platform administration,
                and improve the overall experience.
              </p>
              <p>
                We may also use account and usage information to protect the platform, investigate
                misuse, enforce terms, and reduce operational or compliance risk.
              </p>
            </section>

            <section>
              <h2>4. Public Visibility and Sharing</h2>
              <p>
                Signal Pass supports both readable and anonymized access patterns. If you publish a
                readable profile, information on that profile may be visible to anyone who opens the link.
              </p>
              <p>
                If you prefer a more discreet public presence, Signal Pass may issue anonymized URLs
                for cards, QR codes, and direct sharing. You are responsible for the information you
                choose to make available through your profile.
              </p>
            </section>

            <section>
              <h2>5. Payment and Billing Information</h2>
              <p>
                Subscription billing and payment processing are handled by Stripe or another approved
                provider. We may store limited billing-related data such as customer identifiers,
                subscription status, plan information, and transaction references necessary to operate
                the service.
              </p>
            </section>

            <section>
              <h2>6. Data Sharing</h2>
              <p>
                We do not sell your personal information. We may share limited data with service providers
                who support core operations, including payment processing, hosting, infrastructure,
                analytics, and communications, but only to the extent reasonably necessary to provide
                or support Signal Pass.
              </p>
            </section>

            <section>
              <h2>7. Data Retention</h2>
              <p>
                We retain information for as long as reasonably necessary to operate the platform,
                maintain legitimate business records, enforce our terms, resolve disputes, comply with
                legal obligations, and protect the integrity of the service.
              </p>
            </section>

            <section>
              <h2>8. Security</h2>
              <p>
                We take reasonable administrative, technical, and operational measures to protect
                information associated with the service. However, no platform, storage system, or
                transmission method can be guaranteed to be completely secure.
              </p>
            </section>

            <section>
              <h2>9. Your Control</h2>
              <p>
                You may update profile content and account details through your account. You are
                responsible for reviewing what you publish and for deciding whether to use readable
                or more discreet access options where available.
              </p>
            </section>

            <section>
              <h2>10. Service Administration and Compliance</h2>
              <p>
                We may review account, profile, billing, and usage information where reasonably
                necessary to operate the service, administer access, respond to disputes, investigate
                misuse, evaluate risk, or protect the platform and its operators.
              </p>
            </section>

            <section>
              <h2>11. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. Continued use of Signal Pass
                after an updated version becomes effective constitutes acceptance of the revised policy.
              </p>
            </section>

            <section>
              <h2>12. Contact</h2>
              <p>
                For privacy-related questions, contact{" "}
                <a href="mailto:john@signalrefinery.pro">john@signalrefinery.pro</a>.
              </p>
            </section>
          </div>
        </div>
      </section>
    </Shell>
  );
}