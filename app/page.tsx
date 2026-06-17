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
  title: "TapTagg"
});

export default function HomePage() {
  return (
    <Shell
      footerLeft="Play Tagg. Share instantly."
      footerRight="TapTagg"
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
          <span>TapTagg / Play Tagg</span>
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
          Play Tagg Everywhere.
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
          Share your profile, socials, links, and contact info instantly with one tap.
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
            Start Sharing
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
            Get Your Tagg
          </Link>
        </div>

        <Link
          href="/how-it-works"
          style={{
            display: "inline-block",
            marginTop: 18,
            color: "var(--purple-light)",
            fontSize: 15,
            borderBottom: "1px solid rgba(167,139,250,.55)"
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
            TapTagg works for personal sharing, team rollouts, and industry-specific pages that need more
            conversions than a generic homepage.
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
              No App. No Searching. Just Play Tagg.
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
              One tap sends people straight to your profile, links, socials,
              bookings, music, menu, drop, or contact info.
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
              Your Links, Ready Anywhere.
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
              Your card is just the trigger. TapTagg is where everything you
              want to share stays ready, updated, and easy to open.
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
              Made For Creators And Businesses.
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
              Artists, salespeople, shops, teams, freelancers, and founders can
              move people from real life to the right link in seconds.
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
              See how TapTagg fits dealerships, real estate, insurance, sales teams, and NFC contact capture.
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

          <div
            className="card tagg-card tagg-card-feature"
            style={{
              marginTop: 18,
              padding: 28,
              textAlign: "center",
              background:
                "radial-gradient(circle at 50% -10%, rgba(139,92,246,.16), rgba(139,92,246,.045) 34%, transparent 58%), radial-gradient(circle at 18% 16%, rgba(109,40,217,.10), transparent 34%), linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.014)), linear-gradient(180deg, rgba(10,10,13,.92), rgba(5,5,7,.96))"
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
              Play Tagg In Real Life.
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
              Meet someone. TapTagg them. They get the page, profile, post, song,
              booking link, shop, or contact details you wanted them to have.
            </p>
          </div>
        </div>
      </section>
    </Shell>
  );
}
