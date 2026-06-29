import Link from "next/link";
import { Shell } from "@/components/shared/shell";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  description:
    "Learn how CapturePass works: build your profile once, use NFC or QR as the trigger, and share the right page instantly.",
  path: "/how-it-works",
  title: "How it works"
});

export default function HowItWorksPage() {
  return (
    <Shell
      footerLeft="How it works"
      footerRight="CapturePass"
      navLinks={[
        { href: "/", label: "Home" },
        { href: "/business/pricing", label: "Business Pricing" },
        { href: "/partners", label: "Partners" },
        { href: "/contact-capture-nfc-cards", label: "Contact Capture" }
      ]}
    >
      <section className="simple-hero">
        <h1>Turn Every Handshake Into a Prospect.</h1>
        <p>
          Set up your links once. Share them anywhere with a tap or scan. No app,
          no searching, and no awkward spelling out handles.
        </p>
      </section>

      <section className="steps">
        <div className="step">
          <div className="num">01</div>
          <div>
            <h2>Build your CapturePass</h2>
            <p>
              Add your socials, contact info, booking links, and whatever you want people to open first.
            </p>
          </div>
        </div>

        <div className="step">
          <div className="num">02</div>
          <div>
            <h2>Use your card as the trigger</h2>
            <p>
              Your CapturePass card points people to your contact capture page instantly. Update your profile
              anytime without changing the card.
            </p>
          </div>
        </div>

        <div className="step">
          <div className="num">03</div>
          <div>
            <h2>Share anywhere</h2>
            <p>
              CapturePass someone in the real world and send them straight to the right place:
              follow, book, buy, call, or save your info.
            </p>
          </div>
        </div>
      </section>

      <section className="section-wrap" style={{ paddingTop: 0 }}>
        <div className="card" style={{ padding: 28 }}>
          <h2
            style={{
              margin: "8px 0 12px",
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(36px, 5vw, 58px)",
              lineHeight: 0.98,
              letterSpacing: "-0.04em",
              fontWeight: 800
            }}
          >
            Find the right CapturePass path for your use case.
          </h2>
          <p className="editor-copy" style={{ maxWidth: 760, margin: "0 0 18px" }}>
            Compare plans, explore business pricing, or jump into a landing page for your industry.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Link className="button primary" href="/business/pricing">
              Business Pricing
            </Link>
            <Link className="button secondary" href="/business">
              Business
            </Link>
            <Link className="button secondary" href="/dealerships">
              Dealerships
            </Link>
            <Link className="button secondary" href="/contact-capture-nfc-cards">
              Contact Capture NFC Cards
            </Link>
            <Link className="button secondary" href="/resources">
              Resources
            </Link>
          </div>
        </div>
      </section>
    </Shell>
  );
}
