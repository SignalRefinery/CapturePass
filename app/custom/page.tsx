import Link from "next/link";
import { Shell } from "@/components/shared/shell";
import { createClient } from "@/lib/supabase/server";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://signal-pass.vercel.app").replace(/\/$/, "");
const customPageUrl = `${siteUrl}/custom`;
const customPageQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=440x440&data=${encodeURIComponent(customPageUrl)}`;

async function getInitialAuth() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, slug, is_admin")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    email: user.email || null,
    fullName: profile?.full_name || null,
    slug: profile?.slug || null,
    isAdmin: !!profile?.is_admin
  };
}

const heroTitle = {
  margin: "10px auto 18px",
  maxWidth: 980,
  fontFamily: '"Cormorant Garamond", Georgia, serif',
  fontSize: "clamp(56px, 8vw, 112px)",
  lineHeight: 0.9,
  letterSpacing: "-0.045em",
  color: "#f4efe3"
};

const lead = {
  maxWidth: 860,
  margin: "0 auto",
  color: "var(--muted)",
  fontSize: "clamp(18px, 2vw, 24px)",
  lineHeight: 1.55
};

const sectionTitle = {
  margin: "0 0 12px",
  fontFamily: '"Cormorant Garamond", Georgia, serif',
  fontSize: "clamp(36px, 5vw, 62px)",
  lineHeight: 0.95,
  letterSpacing: "-0.03em",
  color: "#f4efe3"
};

const copy = {
  color: "var(--muted)",
  fontSize: 17,
  lineHeight: 1.75,
  margin: 0
};

const list = {
  display: "grid",
  gap: 12,
  margin: "18px 0 0",
  padding: 0,
  listStyle: "none",
  color: "var(--muted)",
  fontSize: 16,
  lineHeight: 1.5
};

const cardStyle = {
  padding: 28,
  background:
    "radial-gradient(520px 220px at 12% 0%, rgba(201,164,92,.12), transparent 62%), linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,.014)), linear-gradient(180deg, rgba(11,20,35,.86), rgba(7,16,28,.94))"
};

export default async function CustomPage() {
  const initialAuth = await getInitialAuth();

  return (
    <Shell
      footerLeft="Signal Pass"
      footerRight="Custom cards"
      initialAuth={initialAuth}
      navLinks={[
        { href: "/", label: "Home" },
        { href: "/how-it-works", label: "How it works" },
        { href: "/pricing", label: "Pricing" },
        { href: "/partners", label: "Partners" }
      ]}
    >
      <section className="simple-hero" style={{ paddingBottom: 36 }}>
        <div className="kicker">
          <span className="mini-star">✦</span>
          <span>Custom cards</span>
        </div>

        <h1 style={heroTitle}>Instant access to what matters.</h1>

        <p style={lead}>
          Custom access cards for lobbyists, advocacy organizations, companies, campaigns,
          and firms that need legislative packets, policy documents, and briefing materials
          available with a tap or scan.
        </p>
      </section>

      <section className="dashboard-wrap" style={{ paddingTop: 0 }}>
        <div className="card" style={{ padding: 16, overflow: "hidden" }}>
          <img
            src="/custom-legislative-card.jpg"
            alt="Custom SignalPass card held outside the Illinois Capitol"
            style={{
              display: "block",
              width: "100%",
              borderRadius: 24,
              aspectRatio: "16 / 9",
              objectFit: "cover",
              objectPosition: "center"
            }}
          />
        </div>
      </section>

      <section className="dashboard-wrap" style={{ display: "grid", gap: 18 }}>
        <div className="card" style={cardStyle}>
          <div className="dashboard-kicker">Built for the work</div>
          <h2 style={sectionTitle}>For meetings, hearings, packets, and leave-behinds.</h2>
          <p style={copy}>
            SignalPass custom cards are designed for real-world political and public affairs
            environments. Each card can point directly to the materials your audience needs:
            bill briefs, legislative packets, coalition documents, policy one-pagers, sign-up
            pages, or live campaign resources.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 18
          }}
        >
          <div className="card" style={cardStyle}>
            <div className="dashboard-kicker">Speed</div>
            <h2 style={{ ...sectionTitle, fontSize: "clamp(34px, 4vw, 50px)" }}>
              Stop sending links. Start handing them over.
            </h2>
            <p style={copy}>
              When the conversation moves quickly, your materials should move with it. A custom
              card turns a packet, landing page, document folder, or action page into something
              physical, memorable, and immediately accessible.
            </p>
          </div>

          <div className="card" style={cardStyle}>
            <div className="dashboard-kicker">Use cases</div>
            <ul style={list}>
              <li>Legislative packets and bill briefings</li>
              <li>Committee materials and supporting documents</li>
              <li>Advocacy campaigns and issue rollouts</li>
              <li>Lobby day packets, leave-behinds, and follow-up resources</li>
              <li>Events, conferences, hearings, and field teams</li>
            </ul>
          </div>
        </div>

        <div className="card" style={cardStyle}>
          <div className="dashboard-kicker">How it works</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: 14,
              marginTop: 18
            }}
          >
            {[
              "You define what the card should deliver",
              "We design and configure the experience",
              "Cards are printed and pre-programmed",
              "Your team distributes them immediately"
            ].map((step, index) => (
              <div
                key={step}
                style={{
                  border: "1px solid rgba(201,164,92,.16)",
                  borderRadius: 22,
                  padding: 18,
                  background: "rgba(255,255,255,.03)"
                }}
              >
                <div className="dashboard-kicker" style={{ marginBottom: 8 }}>
                  Step {index + 1}
                </div>
                <p style={{ ...copy, color: "#f4efe3" }}>{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 18
          }}
        >
          <div className="card" style={cardStyle}>
            <div className="dashboard-kicker">Control</div>
            <h2 style={{ ...sectionTitle, fontSize: "clamp(34px, 4vw, 50px)" }}>
              Static or dynamically routed.
            </h2>
            <p style={copy}>
              Cards can point to one permanent destination, or route through an updateable link so
              you can reuse inventory, change materials after distribution, or respond quickly when
              a packet changes.
            </p>
          </div>

          <div className="card" style={cardStyle}>
            <div className="dashboard-kicker">What you receive</div>
            <ul style={list}>
              <li>Custom QR codes for projects, cards, leave-behinds, and printed materials</li>
              <li>Optional NFC programming for tap access</li>
              <li>Branding aligned to your organization, coalition, campaign, or firm</li>
              <li>Destination setup for PDFs, document folders, landing pages, or packets</li>
              <li>Support for static or updateable destinations</li>
            </ul>
          </div>
        </div>

        <div className="card" style={{ ...cardStyle, textAlign: "center" }}>
          <div className="dashboard-kicker" style={{ justifyContent: "center" }}>
            <span>Project QR</span>
          </div>
          <h2 style={sectionTitle}>Make every packet easier to reach.</h2>
          <p style={{ ...copy, maxWidth: 760, margin: "0 auto 26px" }}>
            Use QR codes on cards, folders, signs, leave-behinds, handouts, and event materials so
            the right document is always one scan away.
          </p>

          <div
            style={{
              margin: "0 auto 18px",
              width: "fit-content",
              background: "#ffffff",
              borderRadius: 22,
              padding: 16,
              boxShadow: "0 18px 48px rgba(0,0,0,0.28)"
            }}
          >
            <img
              src={customPageQrUrl}
              alt="QR code for SignalPass custom access cards"
              style={{ width: 190, height: 190, display: "block" }}
            />
          </div>

          <p style={{ ...copy, fontSize: 14 }}>
            Example QR for this page. Your custom cards can point to packets, documents, campaign
            pages, forms, or updateable project links.
          </p>
        </div>

        <div className="card" style={{ ...cardStyle, textAlign: "center", padding: 34 }}>
          <h2 style={sectionTitle}>Build your cards.</h2>
          <p style={{ ...copy, maxWidth: 720, margin: "0 auto 24px" }}>
            Tell us what your card needs to deliver. We will help turn it into a branded,
            scannable, tappable asset your team can use in the field.
          </p>
          <Link className="button primary" href="mailto:john@signalrefinery.pro">
            Request custom setup
          </Link>
        </div>
      </section>
    </Shell>
  );
}