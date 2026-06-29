import Link from "next/link";
import { Shell } from "@/components/shared/shell";
import { CapturePassBrandArt } from "@/components/shared/capturepass-brand-art";

type HomepagePageProps = {
  businessCards: Array<{
    copy: string;
    href?: string;
    title: string;
  }>;
  footerLeft: string;
  initialAuth?: {
    email?: string | null;
    fullName?: string | null;
    slug?: string | null;
    isAdmin?: boolean | null;
  } | null;
  resourceLinks: Array<{ href: string; label: string }>;
  teamCapabilities: string[];
};

export function HomepagePage({ businessCards, footerLeft, initialAuth, resourceLinks, teamCapabilities }: HomepagePageProps) {
  return (
    <Shell
      footerLeft={footerLeft}
      footerRight="CapturePass"
      initialAuth={initialAuth}
      pageVariant="light"
      navLinks={[
        { href: "/how-it-works", label: "How it works" },
        { href: "/business/pricing", label: "Business Pricing" },
        { href: "/business", label: "Business" },
        { href: "/contact-capture-nfc-cards", label: "Contact Capture" }
      ]}
    >
      <section className="simple-hero home-hero">
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: 128 }}>
            <CapturePassBrandArt variant="logoMark" priority />
          </div>
        </div>
        <h1 className="home-hero-title">
          Turn Every Handshake Into a <span className="home-accent">Prospect</span>.
        </h1>
        <p className="home-hero-copy">
          Every introduction is a sales opportunity. CapturePass helps you share your contact information instantly,
          capture new leads, and see who is engaging so more conversations become customers.
        </p>
        <p className="home-hero-copy home-hero-copy-secondary">
          Designed for professionals and teams that grow through relationships.
        </p>
        <div className="home-cta-actions home-button-row">
          <Link className="button primary" href="/signup">
            Get started
          </Link>
          <Link className="button secondary" href="/business/pricing">
            See how it works
          </Link>
        </div>
      </section>

      <section className="section-wrap home-section home-manifesto">
        <div className="home-manifesto-copy">
          <h2>
            Most business cards fail.
          </h2>
          <p>They get lost, forgotten, or thrown away.</p>
          <p>
            You never know who kept your card, who looked you up, or who was ready for a follow-up.
          </p>
          <p>CapturePass changes that.</p>
        </div>
      </section>

      <section className="section-wrap home-section">
        <div className="home-section-head">
          <h2>Every sale starts with a conversation.</h2>
          <p>
            Whether you are networking, meeting clients, attending events, or closing deals, CapturePass makes every
            introduction easier to remember and easier to follow up.
          </p>
        </div>
      </section>

      <section className="section-wrap home-section">
        <div className="home-section-head">
          <h2>Three simple steps from first handshake to saved contact.</h2>
        </div>

        <div className="home-step-grid">
          <article className="home-step-card">
            <h3>Share your profile</h3>
            <p>Tap or scan to instantly share your professional profile.</p>
          </article>
          <article className="home-step-card">
            <h3>Capture their contact</h3>
            <p>Collect contact information from interested prospects while the conversation is still fresh.</p>
          </article>
          <article className="home-step-card">
            <h3>Follow up with confidence</h3>
            <p>See who engaged and continue the conversation while you are still top of mind.</p>
          </article>
        </div>
      </section>

      <section className="section-wrap home-section home-usecase-layout">
        <article className="home-feature-card">
          <h2>Built for professionals who grow their business through relationships.</h2>
          <p>CapturePass helps every introduction lead to a clearer next step.</p>
          <div className="home-feature-links">
            <Link className="button secondary" href="/business">
              Explore business profiles
            </Link>
            <Link className="button secondary" href="/contact-capture-nfc-cards">
              View NFC cards
            </Link>
          </div>
        </article>

        <div className="home-usecase-grid">
          {businessCards.map((item) =>
            item.href ? (
              <Link key={item.title} href={item.href} className="home-usecase-card card tagg-card">
                <div className="home-usecase-label">{item.title}</div>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </Link>
            ) : (
              <article key={item.title} className="home-usecase-card card tagg-card">
                <div className="home-usecase-label">{item.title}</div>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            )
          )}
        </div>
      </section>

      <section className="section-wrap home-section home-value-section">
        <div className="home-value-copy">
          <h2>Shared profiles, contact capture, analytics, and team management in one place.</h2>
          <p>Give every team a cleaner way to capture leads, stay organized, and keep follow-up moving.</p>
        </div>

        <div className="home-benefit-grid">
          {[
            {
              copy: "Give every rep a polished, on-brand profile that is easy to share and easy to keep current.",
              title: "Individual and team profiles"
            },
            {
              copy: "Collect contact details from interested prospects while the conversation is still fresh.",
              title: "Contact capture"
            },
            {
              copy: "Keep your logo, colors, and messaging consistent across every card and profile.",
              title: "Business branding"
            },
            {
              copy: "Update people, roles, and information from one place without reprinting anything.",
              title: "Team management"
            }
          ].map((benefit) => (
            <article key={benefit.title} className="home-benefit-card card tagg-card">
              <h3>{benefit.title}</h3>
              <p>{benefit.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-wrap home-section home-teams">
        <div className="home-teams-copy">
          <h2>Why teams choose CapturePass.</h2>
          <p>
            CapturePass gives each team a consistent brand presence while keeping relationships, lead history, and
            follow-up with the business.
          </p>
        </div>

        <div className="home-capabilities-panel">
          {teamCapabilities.map((item) => (
            <div key={item} className="home-capability-row">
              {item}
            </div>
          ))}
        </div>

        <p className="home-teams-foot">
          Everything your team needs to capture more leads and follow up with confidence.
        </p>
      </section>

      <section className="section-wrap home-section home-outcomes">
        <div className="home-outcomes-copy">
          <h2>Stop printing your information. Start capturing theirs.</h2>
          <p>
            Paper business cards only go one direction. CapturePass helps you exchange information, collect contacts,
            and follow up with people who are already interested.
          </p>
        </div>
      </section>

      <section className="section-wrap home-section home-resources">
        <div className="home-resource-copy">
          <h2>Learn how contact capture works.</h2>
          <p>Guides, comparisons, and resources to help businesses modernize networking, follow-up, and lead capture.</p>
        </div>

        <div className="home-resource-panel">
          <div className="home-resource-links">
            {resourceLinks.map((link) => (
              <Link key={link.href} href={link.href} className="button secondary">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section-wrap home-section home-final-cta home-cta-card">
        <div className="home-final-copy home-cta-copy">
          <h2>Every handshake is an opportunity.</h2>
          <p>
            Do not let the next one walk away. Start capturing contacts, tracking engagement, and following up faster
            with CapturePass.
          </p>
        </div>

        <div className="home-cta-actions">
          <Link className="button primary" href="/signup">
            Get started
          </Link>
          <Link className="button secondary" href="/business/pricing">
            View business plans
          </Link>
        </div>
      </section>
    </Shell>
  );
}
