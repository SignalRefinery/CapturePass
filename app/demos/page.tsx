import Link from "next/link";
import { Shell } from "@/components/shared/shell";
import { buildPageMetadata } from "@/lib/seo";
import { getDemoCenterDemos } from "@/lib/demo-center";

export const metadata = buildPageMetadata({
  description:
    "Explore fictional CapturePass demo profiles for every supported business type, with QR codes that open each live example.",
  path: "/demos",
  title: "CapturePass Demo Center"
});

export default function DemoCenterPage() {
  const demos = getDemoCenterDemos();

  return (
    <Shell
      footerLeft="Demo Center"
      footerRight="CapturePass"
      pageVariant="light"
      navLinks={[
        { href: "/", label: "Home" },
        { href: "/business", label: "Business" },
        { href: "/business/pricing", label: "Business Pricing" },
        { href: "/contact-capture-nfc-cards", label: "Contact Capture" }
      ]}
    >
      <section className="simple-hero" style={heroSection}>
        <div className="kicker">
          <span className="mini-star">✦</span>
          <span>Sales Demo Asset</span>
        </div>
        <h1 style={heroHeading}>Explore CapturePass Demos</h1>
        <p style={heroSubheadline}>
          Each demo shows how CapturePass becomes the front door for a different type of business.
        </p>
        <p style={heroCopy}>All examples are fictional and safe to share in sales calls, onboarding, or walkthroughs.</p>
        <p style={heroHighlight}>Demo profiles use fictional data.</p>
      </section>

      <section className="section-wrap">
        <div style={grid}>
          {demos.map((demo) => {
            return (
              <article className="card tagg-card" key={demo.slug} style={card}>
                <div style={cardTop}>
                  <div>
                    <div className="dashboard-kicker">{demo.audienceLabelText || "General Business"}</div>
                    <h2 style={cardTitle}>{demo.profile.full_name}</h2>
                    <p style={companyLine}>
                      {demo.profile.organization_name}
                      {demo.viewCount > 0 ? ` · ${demo.viewCount} property views` : ""}
                    </p>
                  </div>
                  <div style={slugPill}>{demo.slug}</div>
                </div>

                <p style={summary}>{demo.summary}</p>

                <div style={cardBody}>
                  <div style={qrWrap}>
                    {demo.qrUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- QR provider returns a generated runtime image URL.
                      <img
                        src={demo.qrUrl}
                        alt={`QR code for ${demo.profile.full_name} at ${demo.profile.organization_name}`}
                        style={qrImage}
                      />
                    ) : null}
                    <div style={qrCaption}>Scan to view on your phone</div>
                  </div>

                  <div style={details}>
                    <div style={detailRow}>
                      <span>Slug</span>
                      <strong>/{demo.slug}</strong>
                    </div>
                    <div style={detailRow}>
                      <span>Profile</span>
                      <strong>{demo.profile.role_line}</strong>
                    </div>
                    <div style={detailRow}>
                      <span>Audience</span>
                      <strong>{demo.audienceLabelText || "General Business"}</strong>
                    </div>
                    <div style={detailRow}>
                      <span>Profile URL</span>
                      <strong>{demo.profileUrl.replace(/^https?:\/\//, "")}</strong>
                    </div>
                    {demo.digitalPassUrl ? (
                      <div style={detailRow}>
                        <span>Digital Pass</span>
                        <strong>{demo.digitalPassUrl.replace(/^https?:\/\//, "")}</strong>
                      </div>
                    ) : null}
                    <Link className="button primary" href={`/${demo.slug}`} style={{ width: "fit-content" }}>
                      Open Demo
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </Shell>
  );
}

const heroSection = {
  marginTop: 18
} as const;

const heroHeading = {
  maxWidth: 900
} as const;

const heroSubheadline = {
  maxWidth: 800
} as const;

const heroCopy = {
  maxWidth: 760
} as const;

const heroHighlight = {
  maxWidth: 760
} as const;

const grid = {
  display: "grid",
  gap: 22,
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))"
} as const;

const card = {
  padding: 22,
  display: "flex",
  flexDirection: "column",
  gap: 18
} as const;

const cardTop = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "flex-start"
} as const;

const cardTitle = {
  margin: "4px 0 0"
} as const;

const companyLine = {
  margin: "8px 0 0",
  color: "var(--editor-subtext, rgba(16, 24, 40, 0.76))"
} as const;

const slugPill = {
  borderRadius: 999,
  padding: "8px 12px",
  background: "rgba(40, 98, 160, 0.08)",
  color: "var(--editor-text, #1d314d)",
  fontSize: 13,
  fontWeight: 700,
  whiteSpace: "nowrap"
} as const;

const summary = {
  margin: 0,
  maxWidth: 820,
  color: "var(--editor-text, #1d314d)",
  lineHeight: 1.6
} as const;

const cardBody = {
  display: "grid",
  gap: 18,
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  alignItems: "start"
} as const;

const qrWrap = {
  display: "grid",
  justifyItems: "center",
  gap: 10
} as const;

const qrImage = {
  width: 168,
  height: 168,
  borderRadius: 20,
  background: "#fff",
  border: "1px solid rgba(40, 98, 160, 0.12)",
  padding: 8
} as const;

const qrCaption = {
  textAlign: "center",
  fontSize: 13,
  color: "var(--editor-subtext, rgba(16, 24, 40, 0.72))"
} as const;

const details = {
  display: "grid",
  gap: 12
} as const;

const detailRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  borderBottom: "1px solid rgba(40, 98, 160, 0.08)",
  paddingBottom: 10,
  fontSize: 14
} as const;
