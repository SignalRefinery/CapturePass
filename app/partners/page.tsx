import Link from "next/link";
import { Shell } from "@/components/shared/shell";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  description:
    "Partner with TapTagg to introduce NFC cards, QR profiles, and contact capture to creators, shops, teams, salespeople, and builders.",
  path: "/partners",
  title: "Partners"
});

export default function PartnersPage() {
  return (
    <Shell
      footerLeft="Share TapTagg"
      footerRight="TapTagg"
      navLinks={[
        { href: "/", label: "Home" },
        { href: "/pricing", label: "Pricing" },
        { href: "/how-it-works", label: "How it works" },
        { href: "/contact-capture-nfc-cards", label: "Contact Capture" }
      ]}
    >
      <section className="simple-hero">
        <div className="kicker">
          <span className="mini-star">✦</span>
          <span>Partners</span>
        </div>
        <h1>Put TapTagg in more hands.</h1>
        <p>
          TapTagg grows through people who know creators, shops, teams, salespeople,
          artists, and builders who need a faster way to share what they do.
        </p>
      </section>

      <section className="section-wrap">
        <div className="steps">
          <div className="step"><div className="num">01</div><div><h2>Share TapTagg</h2><p>Introduce TapTagg to people who should be easier to find, follow, book, buy from, or contact.</p></div></div>
          <div className="step"><div className="num">02</div><div><h2>Use your referral code</h2><p>Approved partners get a code so referrals can be tracked cleanly.</p></div></div>
          <div className="step"><div className="num">03</div><div><h2>Help people Play Tagg</h2><p>Send creators and businesses a tool they can use immediately in real life.</p></div></div>
        </div>
      </section>

      <section className="section-wrap" style={{ paddingTop: 0 }}>
        <div className="card" style={{ padding: 28, textAlign: "center" }}>
          <div className="dashboard-kicker" style={{ justifyContent: "center" }}>
            Partner requests
          </div>
          <h2
            style={{
              margin: "8px auto 12px",
              maxWidth: 760,
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(36px, 5vw, 64px)",
              lineHeight: 0.98,
              letterSpacing: "-0.035em",
              fontWeight: 800
            }}
          >
            Know people who should Play Tagg?
          </h2>
          <p className="editor-copy" style={{ maxWidth: 720, margin: "0 auto 22px" }}>
            Tell us who you work with, who you can reach, and how TapTagg fits
            the way they share.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
            <Link className="button primary" href="/partner-request">
              Request partner code
            </Link>
            <Link className="button secondary" href="/business">
              Business
            </Link>
            <Link className="button secondary" href="/contact-capture-nfc-cards">
              Contact Capture NFC Cards
            </Link>
          </div>
        </div>
      </section>
    </Shell>
  );
}

