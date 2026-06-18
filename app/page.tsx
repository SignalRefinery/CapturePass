import Link from "next/link";
import { Shell } from "@/components/shared/shell";
import { JsonLd } from "@/components/seo/json-ld";
import {
  buildOrganizationJsonLd,
  buildPageMetadata,
  SITE_DESCRIPTION
} from "@/lib/seo";

export const metadata = buildPageMetadata({
  description: SITE_DESCRIPTION,
  path: "/",
  title: "CapturePass"
});

export default function HomePage() {
  return (
    <Shell
      footerLeft="Turn Every Handshake Into a Prospect."
      footerRight="CapturePass"
      navLinks={[
        { href: "/how-it-works", label: "How it works" },
        { href: "/pricing", label: "Pricing" },
        { href: "/business", label: "Business" },
        { href: "/contact-capture-nfc-cards", label: "Contact Capture" }
      ]}
    >
      <JsonLd data={buildOrganizationJsonLd()} />

      <section className="simple-hero" style={{ paddingBottom: 40 }}>
        <div className="kicker">
          <span className="mini-star">✦</span>
          <span>CapturePass</span>
        </div>

        <h1
          style={{
            maxWidth: 1080,
            margin: "28px auto 18px",
            fontFamily: "var(--font-heading)",
            fontWeight: 800,
            fontSize: "clamp(56px, 7.4vw, 104px)",
            lineHeight: 0.94,
            letterSpacing: "-0.04em"
          }}
        >
          Turn Every Handshake Into a Prospect.
        </h1>

        <p
          style={{
            maxWidth: 820,
            margin: "0 auto",
            color: "#b6bcc8",
            fontSize: 20,
            lineHeight: 1.62,
            fontWeight: 500
          }}
        >
          Capture contacts, share the right information instantly, and turn every handshake into a trackable business opportunity.
        </p>

        <div
          style={{
            marginTop: 34,
            display: "flex",
            justifyContent: "center",
            gap: 14,
            flexWrap: "wrap"
          }}
        >
          <Link className="button primary" href="/signup">
            Start Capturing Contacts
          </Link>

          <Link
            className="button secondary"
            href="/pricing"
            style={{
              border: "1px solid rgba(255,255,255,.1)",
              background: "rgba(255,255,255,.025)",
              color: "var(--text)"
            }}
          >
            Request a Demo
          </Link>
        </div>

        <Link
          href="/how-it-works"
          style={{
            display: "inline-block",
            marginTop: 18,
            color: "var(--brand-deep)",
            fontSize: 15,
            borderBottom: "1px solid rgba(var(--brand-deep-rgb),.55)"
          }}
        >
          See how it works
        </Link>
      </section>

      <section className="section-wrap">
        <div className="card tagg-card" style={{ padding: 26, marginBottom: 18 }}>
          <div className="kicker">
            <span className="mini-star">✦</span>
            <span>Solutions</span>
          </div>
          <h2
            style={{
              margin: "14px 0 10px",
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(34px, 4vw, 44px)",
              lineHeight: 0.98,
              letterSpacing: "-0.035em",
              fontWeight: 800
            }}
          >
            Built for individuals, teams, and contact capture.
          </h2>
          <p style={{ margin: 0, color: "#b6bcc8", fontSize: 16, lineHeight: 1.62, fontWeight: 500 }}>
            CapturePass works for personal sharing, team rollouts, and industry-specific pages built to capture
            contacts instead of just handing out a link.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 18 }}>
            <Link className="button secondary" href="/business">
              Business
            </Link>
            <Link className="button secondary" href="/business-individual">
              Business Individual
            </Link>
            <Link className="button secondary" href="/contact-capture-nfc-cards">
              Contact Capture NFC Cards
            </Link>
            <Link className="button secondary" href="/dealerships">
              Dealerships
            </Link>
          </div>
        </div>

        <div style={{ display: "grid", gap: 18 }}>
          <div className="card tagg-card" style={{ padding: 26 }}>
            <h2
              style={{
                margin: "0 0 10px",
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(34px, 4vw, 42px)",
                lineHeight: 0.98,
                letterSpacing: "-0.035em",
                fontWeight: 800
              }}
            >
              No app. No searching. Just a faster way to capture the contact.
            </h2>
            <p
              style={{
                margin: 0,
                color: "#b6bcc8",
                fontSize: 16,
                lineHeight: 1.62,
                fontWeight: 500
              }}
            >
              One tap sends people straight to your profile, contact capture flow, links, socials, bookings,
              menu, or next-step page.
            </p>
          </div>

          <div className="card tagg-card" style={{ padding: 26 }}>
            <h2
              style={{
                margin: "0 0 10px",
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(34px, 4vw, 42px)",
                lineHeight: 0.98,
                letterSpacing: "-0.035em",
                fontWeight: 800
              }}
            >
              One Profile. Every Follow-Up Path.
            </h2>
            <p
              style={{
                margin: 0,
                color: "#b6bcc8",
                fontSize: 16,
                lineHeight: 1.62,
                fontWeight: 500
              }}
            >
              Your card is the trigger. CapturePass is where contact capture, relationship ownership, and follow-up
              stay ready, updated, and easy to open.
            </p>
          </div>

          <div className="card tagg-card" style={{ padding: 26 }}>
            <h2
              style={{
                margin: "0 0 10px",
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(34px, 4vw, 42px)",
                lineHeight: 0.98,
                letterSpacing: "-0.035em",
                fontWeight: 800
              }}
            >
              Built For People Who Need Relationship Ownership.
            </h2>
            <p
              style={{
                margin: 0,
                color: "#b6bcc8",
                fontSize: 16,
                lineHeight: 1.62,
                fontWeight: 500
              }}
            >
              Sales teams, creators, shops, and local businesses can move people from real life to the right
              contact flow in seconds.
            </p>
          </div>
          <div className="card tagg-card" style={{ padding: 26 }}>
            <h2
              style={{
                margin: "0 0 10px",
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(34px, 4vw, 42px)",
                lineHeight: 0.98,
                letterSpacing: "-0.035em",
                fontWeight: 800
              }}
            >
              Explore industry pages.
            </h2>
            <p
              style={{
                margin: "0 0 16px",
                color: "#b6bcc8",
                fontSize: 16,
                lineHeight: 1.62,
                fontWeight: 500
              }}
            >
              See how CapturePass fits dealerships, real estate, insurance, sales teams, and NFC contact capture
              workflows.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Link className="button secondary" href="/real-estate-agents">
                Real Estate
              </Link>
              <Link className="button secondary" href="/insurance-agents">
                Insurance
              </Link>
              <Link className="button secondary" href="/sales-teams">
                Sales Teams
              </Link>
            </div>
          </div>
          <div className="card tagg-card" style={{ padding: 26 }}>
            <h2
              style={{
                margin: "0 0 10px",
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(34px, 4vw, 42px)",
                lineHeight: 0.98,
                letterSpacing: "-0.035em",
                fontWeight: 800
              }}
            >
              Learn from the resource center.
            </h2>
            <p
              style={{
                margin: "0 0 16px",
                color: "#b6bcc8",
                fontSize: 16,
                lineHeight: 1.62,
                fontWeight: 500
              }}
            >
              Explore guides on contact capture, NFC business cards, and the workflows behind dealership,
              insurance, real estate, and sales use cases.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Link className="button secondary" href="/resources">
                Resource Center
              </Link>
              <Link className="button secondary" href="/resources/category/dealerships">
                Dealership Resources
              </Link>
              <Link className="button secondary" href="/resources/category/sales">
                Sales Resources
              </Link>
            </div>
          </div>

          <div className="card tagg-card" style={{ padding: 26 }}>
            <h2
              style={{
                margin: "0 0 10px",
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(34px, 4vw, 42px)",
                lineHeight: 0.98,
                letterSpacing: "-0.035em",
                fontWeight: 800
              }}
            >
              Springfield, Illinois cluster.
            </h2>
            <p
              style={{
                margin: "0 0 16px",
                color: "#b6bcc8",
                fontSize: 16,
                lineHeight: 1.62,
                fontWeight: 500
              }}
            >
              Localize your search path with Springfield pages built for contact capture, NFC business cards, and
              digital business cards as the SEO support category.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Link className="button secondary" href="/springfield-il-nfc-business-cards">
                NFC Business Cards
              </Link>
              <Link className="button secondary" href="/springfield-il-digital-business-cards">
                Digital Business Cards
              </Link>
              <Link className="button secondary" href="/springfield-il-contact-capture">
                Contact Capture
              </Link>
            </div>
          </div>

          <div
            className="card tagg-card tagg-card-feature"
            style={{
              marginTop: 18,
              padding: 28,
              textAlign: "center",
              background:
                "radial-gradient(circle at 50% -10%, rgba(var(--brand-primary-rgb),.16), rgba(var(--brand-primary-rgb),.045) 34%, transparent 58%), radial-gradient(circle at 18% 16%, rgba(var(--brand-deep-rgb),.10), transparent 34%), linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.014)), linear-gradient(180deg, rgba(10,10,13,.92), rgba(5,5,7,.96))"
            }}
          >
            <h3
              style={{
                margin: "0 0 10px",
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(36px, 4.4vw, 44px)",
                lineHeight: 0.98,
                letterSpacing: "-0.035em",
                fontWeight: 800
              }}
            >
            Make Every Handshake Count.
            </h3>
            <p
              style={{
                margin: "0 auto",
                maxWidth: 860,
                color: "#b6bcc8",
                fontSize: 18,
                lineHeight: 1.62,
                fontWeight: 500
              }}
            >
              Meet someone. Capture their contact. Send them the profile, page, booking link, or next step they
              actually need.
            </p>
          </div>
        </div>
      </section>
    </Shell>
  );
}
