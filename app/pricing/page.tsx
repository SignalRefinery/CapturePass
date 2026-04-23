import Link from "next/link";
import { Shell } from "@/components/shared/shell";

export default function PricingPage() {
  return (
    <Shell
      footerLeft="Pricing"
      footerRight="Signal Pass"
      navLinks={[
        { href: "/", label: "Home" },
        { href: "/how-it-works", label: "How it works" },
        { href: "/john-keating", label: "Live profile" }
      ]}
    >
      <section className="simple-hero" style={{ paddingBottom: 40 }}>
        <div className="kicker">
          <span className="mini-star">✦</span>
          <span>Signal Pass</span>
        </div>

        <h1
          style={{
            maxWidth: 980,
            margin: "28px auto 18px",
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: "clamp(58px, 7vw, 96px)",
            lineHeight: 0.92,
            letterSpacing: "-0.04em"
          }}
        >
          Choose how you show up.
        </h1>

        <p
          style={{
            maxWidth: 820,
            margin: "0 auto",
            color: "var(--muted)",
            fontSize: 21,
            lineHeight: 1.72
          }}
        >
          Structured, direct, and built for real interactions. Signal Pass gives
          you a cleaner way to share the right information at the right moment.
        </p>
      </section>

      <section className="section-wrap">
        <div style={{ display: "grid", gap: 18 }}>
          <div className="card" style={{ padding: 28 }}>
            <h2 style={heading}>Essential</h2>

            <p style={desc}>
              A clean, structured profile designed for straightforward sharing
              and reliable follow-up.
            </p>

            <div style={price}>
              $25<span style={sub}> / month</span>
            </div>

            <div style={setup}>$99 one-time setup</div>

            <div style={features}>
              <div>Direct profile access</div>
              <div>Readable public link</div>
              <div>QR / NFC compatibility</div>
              <div>Four primary links</div>
            </div>

            <Link className="button primary" href="/api/checkout?plan=essential">
              Activate Essential
            </Link>
          </div>

          <div className="card" style={{ padding: 28 }}>
            <h2 style={heading}>Professional</h2>

            <p style={desc}>
              Stronger positioning and a more refined presentation for
              higher-trust environments.
            </p>

            <div style={price}>
              $39<span style={sub}> / month</span>
            </div>

            <div style={setup}>$99 one-time setup</div>

            <div style={features}>
              <div>Everything in Essential</div>
              <div>Improved presentation flow</div>
              <div>Cleaner follow-up experience</div>
              <div>Priority handling</div>
            </div>

            <Link className="button primary" href="/api/checkout?plan=professional">
              Upgrade to Professional
            </Link>
          </div>

          <div className="card" style={{ padding: 28 }}>
            <h2 style={heading}>Premium</h2>

            <p style={desc}>
              Fully configured, positioned, and tuned for high-stakes
              interactions and polished delivery.
            </p>

            <div style={price}>
              $49<span style={sub}> / month</span>
            </div>

            <div style={setup}>$99 one-time setup</div>

            <div style={features}>
              <div>Full profile setup</div>
              <div>Positioning optimization</div>
              <div>Hands-on refinement</div>
              <div>Ongoing adjustments</div>
            </div>

            <Link className="button primary" href="/api/checkout?plan=premium">
              Start Premium
            </Link>
          </div>

          <div
            className="card"
            style={{
              marginTop: 18,
              padding: 28,
              textAlign: "center",
              background:
                "radial-gradient(500px 180px at 50% -20%, rgba(201,164,92,.08), transparent 60%), linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.012)), linear-gradient(180deg, rgba(11,20,35,.82), rgba(7,16,28,.9))"
            }}
          >
            <h3 style={bandHeading}>Built for clean introductions.</h3>

            <p style={bandText}>
              This is not about adding more links. It is about making the next
              step obvious, immediate, and frictionless.
            </p>
          </div>
        </div>
      </section>
    </Shell>
  );
}

const heading = {
  margin: "0 0 10px",
  fontFamily: '"Cormorant Garamond", Georgia, serif',
  fontSize: 42,
  lineHeight: 0.95,
  letterSpacing: "-0.02em"
};

const desc = {
  margin: "0 0 16px",
  color: "var(--muted)",
  fontSize: 17,
  lineHeight: 1.7
};

const price = {
  marginBottom: 6,
  fontFamily: '"Cormorant Garamond", Georgia, serif',
  fontSize: 42
};

const sub = {
  fontSize: 16,
  color: "var(--muted)"
};

const setup = {
  marginBottom: 18,
  color: "var(--muted)",
  fontSize: 14
};

const features = {
  display: "grid",
  gap: 8,
  marginBottom: 22,
  color: "var(--muted)",
  fontSize: 15
};

const bandHeading = {
  margin: "0 0 10px",
  fontFamily: '"Cormorant Garamond", Georgia, serif',
  fontSize: 44
};

const bandText = {
  margin: "0 auto",
  maxWidth: 800,
  color: "var(--muted)",
  fontSize: 18,
  lineHeight: 1.7
};