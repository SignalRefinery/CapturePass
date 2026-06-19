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
  resourceLinks: Array<{ href: string; label: string }>;
  teamCapabilities: string[];
};

export function HomepagePage({ businessCards, footerLeft, resourceLinks, teamCapabilities }: HomepagePageProps) {
  return (
    <Shell
      footerLeft={footerLeft}
      footerRight="CapturePass"
      pageVariant="light"
      navLinks={[
        { href: "/how-it-works", label: "How it works" },
        { href: "/pricing", label: "Pricing" },
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
          The most valuable business relationships often begin with a single conversation.
        </p>
        <p className="home-hero-copy home-hero-copy-secondary">
          CapturePass helps you exchange information, capture contacts, and turn introductions into opportunities.
        </p>
        <div className="home-cta-actions home-button-row">
          <Link className="button primary" href="/signup">
            Start Capturing Contacts
          </Link>
          <Link className="button secondary" href="/pricing">
            Request a Demo
          </Link>
        </div>
      </section>

      <section className="section-wrap home-section home-manifesto">
        <div className="home-manifesto-copy">
          <h2>
            Relationships Drive <span className="home-accent">Business</span>.
          </h2>
          <div className="home-manifesto-lines" aria-label="Relationships drive business">
            <span>Every customer.</span>
            <span>Every referral.</span>
            <span>Every partnership.</span>
            <span>Every <span className="home-accent-success">sale</span>.</span>
          </div>
          <p>They all start the same way: two people connect.</p>
          <p>
            Yet most businesses still rely on disconnected tools, forgotten business cards, and chance follow-up to
            manage some of their most valuable opportunities.
          </p>
          <p>CapturePass helps you build stronger connections from the very first interaction.</p>
        </div>
      </section>

      <section className="section-wrap home-section">
        <div className="home-section-head">
          <div className="kicker">
            <span className="mini-star">✦</span>
            <span>How CapturePass works</span>
          </div>
          <h2>Three simple steps from first handshake to saved contact.</h2>
        </div>

        <div className="home-step-grid">
          <article className="home-step-card">
            <div className="home-step-eyebrow">Step 1</div>
            <h3>Share your profile</h3>
            <p>Send a digital business card, NFC link, or branded profile that feels polished in person and online.</p>
          </article>
          <article className="home-step-card">
            <div className="home-step-eyebrow">Step 2</div>
            <h3>Capture their contact</h3>
            <p>Turn a conversation into a saved contact while interest is highest, not after the moment is gone.</p>
          </article>
          <article className="home-step-card">
            <div className="home-step-eyebrow">Step 3</div>
            <h3>Follow up from the right place</h3>
            <p>Route each interaction to the right booking link, form, page, or next step for the person in front of you.</p>
          </article>
        </div>
      </section>

      <section className="section-wrap home-section home-usecase-layout">
        <article className="home-feature-card">
          <div className="dashboard-kicker">Built for real-world handoffs</div>
          <h2>Every introduction has a different path forward.</h2>
          <p>
            CapturePass keeps the handoff useful whether you are meeting one person or managing a team in the field.
          </p>
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
          <h2>
            Why teams choose <span className="home-accent">CapturePass</span>.
          </h2>
          <p>CapturePass helps teams make the most of every in-person conversation without forcing a rigid workflow.</p>
        </div>

        <div className="home-benefit-grid">
          {[
            "Capture more leads from in-person conversations",
            "Keep contact ownership with the business",
            "Update profiles without reprinting cards",
            "Route people to the right booking link, form, page, or next step"
          ].map((benefit) => (
            <article key={benefit} className="home-benefit-card card tagg-card">
              <h3>{benefit}</h3>
              <p>
                Built to keep the introduction moving so the next action is simple, visible, and easy to track.
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-wrap home-section home-teams">
        <div className="home-teams-copy">
          <div className="dashboard-kicker">Built for teams</div>
          <h2>Shared profiles, contact capture, analytics, and team management in one place.</h2>
          <p>
            CapturePass gives each team a consistent brand presence while still letting individuals own the conversation
            in the field.
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
          Everything your team needs to create consistent, professional connections.
        </p>
      </section>

      <section className="section-wrap home-section home-outcomes">
        <div className="home-outcomes-copy">
          <h2>Stronger connections. Better outcomes.</h2>
          <p>
            Whether that next step is a phone call, appointment, quote request, website visit, application, or
            conversation, CapturePass helps create a smoother path forward.
          </p>
        </div>
      </section>

      <section className="section-wrap home-section home-resources">
        <div className="home-resource-copy">
          <div className="dashboard-kicker">Resources</div>
          <h2>Learn how contact capture works.</h2>
          <p>
            Guides, comparisons, and industry playbooks for teams moving from paper cards to measurable follow-up.
          </p>
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
          <h2>Turn every handshake into a captured contact.</h2>
          <p>
            CapturePass helps people move from real-world conversations to saved contacts, follow-up, bookings, and
            sales workflows.
          </p>
        </div>

        <div className="home-cta-actions">
          <Link className="button primary" href="/signup">
            Get started
          </Link>
          <Link className="button secondary" href="/pricing">
            View business plans
          </Link>
        </div>
      </section>
    </Shell>
  );
}
