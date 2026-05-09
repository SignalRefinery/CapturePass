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
        { href: "/custom", label: "Custom cards" }
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
              Expanded profile options, enhanced branding, and stronger tools
              for professional follow-up.
            </p>

            <div style={soonPrice}>Available soon</div>

            <div style={setup}>Professional features are in development.</div>

            <div style={features}>
              <div>Everything in Essential</div>
              <div>Expanded links and profile sections</div>
              <div>Enhanced branding options</div>
              <div>Priority support access</div>
            </div>

            <button className="button primary" type="button" disabled style={disabledButton}>
              Available soon
            </button>
          </div>

          <div className="card" style={{ padding: 28 }}>
            <h2 style={heading}>Premium</h2>

            <p style={desc}>
              Advanced profile configuration, managed onboarding, and deeper
              customization for higher-touch use cases.
            </p>

            <div style={soonPrice}>Available soon</div>

            <div style={setup}>Premium features are in development.</div>

            <div style={features}>
              <div>Everything in Professional</div>
              <div>Advanced customization</div>
              <div>Managed onboarding support</div>
              <div>Future analytics access</div>
            </div>

            <button className="button primary" type="button" disabled style={disabledButton}>
              Available soon
            </button>
          </div>

          <div
            className="card"
            style={{
              marginTop: 18,
              padding: "clamp(22px, 5vw, 34px)",
              display: "grid",
              gap: 18,
              textAlign: "center",
              background:
                "radial-gradient(520px 220px at 12% 0%, rgba(201,164,92,.12), transparent 62%), linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,.014)), linear-gradient(180deg, rgba(11,20,35,.86), rgba(7,16,28,.94))"
            }}
          >
            <div className="kicker" style={{ margin: "0 auto" }}>
              <span className="mini-star">✦</span>
              <span>Custom cards</span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
                gap: 24,
                alignItems: "center"
              }}
            >
              <div style={{ display: "grid", justifyItems: "center" }}>
                <h2 style={heading}>Legislative access cards</h2>

                <p style={{ ...desc, maxWidth: 760, textAlign: "center" }}>
                  Custom QR and NFC cards for lobbyists, advocacy organizations, campaigns,
                  companies, and firms that need fast access to legislative packets, policy
                  documents, briefing materials, and live resources.
                </p>

                <div style={{ ...features, maxWidth: 720, textAlign: "center", justifyItems: "center" }}>
                  <div>Direct access to legislative packets and supporting documents</div>
                  <div>Custom branding for organizations, coalitions, and campaigns</div>
                  <div>Static or dynamically routed destinations</div>
                  <div>Built for meetings, hearings, events, and field teams</div>
                </div>

                <Link className="button primary" href="/custom">
                  View custom card options
                </Link>
              </div>

              <div
                style={{
                  border: "1px solid rgba(201,164,92,.18)",
                  borderRadius: 24,
                  padding: 22,
                  background: "rgba(255,255,255,.035)",
                  textAlign: "center"
                }}
              >
                <h3 style={{ ...bandHeading, fontSize: 34, marginBottom: 12 }}>
                  Stop sending links. Start handing them over.
                </h3>
                <p style={{ ...bandText, fontSize: 16, textAlign: "center" }}>
                  Designed for controlled distribution where the right document needs to be one
                  tap away.
                </p>
              </div>
            </div>
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

const soonPrice = {
  marginBottom: 6,
  fontFamily: '"Cormorant Garamond", Georgia, serif',
  fontSize: 36,
  color: "#d8bf78"
};

const disabledButton = {
  opacity: 0.62,
  cursor: "not-allowed"
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