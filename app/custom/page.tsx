const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://signal-pass.vercel.app").replace(/\/$/, "");
const customPageUrl = `${siteUrl}/custom`;
const customPageQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=440x440&data=${encodeURIComponent(customPageUrl)}`;

export default function CustomPage() {
  return (
    <main
      style={{
        padding: "120px 24px 80px",
        maxWidth: "1100px",
        margin: "0 auto",
        color: "#e5e7eb",
      }}
    >
      {/* HERO */}
      <section style={{ textAlign: "center", marginBottom: "80px" }}>
        <div
          style={{
            borderRadius: "16px",
            overflow: "hidden",
            marginBottom: "40px",
          }}
        >
          <img
            src="/custom-card.jpg" // 👈 replace with your uploaded image path
            alt="Custom SignalPass card"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>

        <h1
          style={{
            fontSize: "48px",
            fontWeight: 600,
            marginBottom: "16px",
          }}
        >
          Instant access to what matters.
        </h1>

        <p
          style={{
            fontSize: "18px",
            color: "#9ca3af",
            maxWidth: "700px",
            margin: "0 auto",
          }}
        >
          Custom SignalPass cards give your team, stakeholders, and partners
          immediate access to legislative packets, policy documents, and campaign
          materials — on demand.
        </p>

        <p
          style={{
            marginTop: "16px",
            fontSize: "16px",
            color: "#6b7280",
          }}
        >
          Built for lobbyists, advocacy organizations, campaigns, and firms that
          need to move information quickly in high-trust environments.
        </p>
        <div
          style={{
            margin: "34px auto 0",
            display: "grid",
            placeItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "18px",
              padding: "14px",
              boxShadow: "0 18px 48px rgba(0,0,0,0.28)",
            }}
          >
            <img
              src={customPageQrUrl}
              alt="QR code for SignalPass custom legislative access cards"
              style={{ width: "180px", height: "180px", display: "block" }}
            />
          </div>
          <p
            style={{
              margin: 0,
              color: "#9ca3af",
              fontSize: "14px",
            }}
          >
            Scan to open this custom cards page: {customPageUrl.replace(/^https?:\/\//, "")}
          </p>
        </div>
      </section>

      {/* WHAT THIS IS */}
      <section style={{ marginBottom: "64px" }}>
        <h2 style={{ fontSize: "28px", marginBottom: "16px" }}>
          Built for real-world use.
        </h2>

        <p style={{ color: "#9ca3af", lineHeight: 1.6 }}>
          SignalPass custom cards are designed for use inside and around
          legislative environments. Each card is pre-programmed to deliver exactly
          what you need — whether that’s a full legislative packet, briefing
          materials, issue summaries, or live campaign resources.
        </p>
      </section>

      {/* WHY IT MATTERS */}
      <section style={{ marginBottom: "64px" }}>
        <h2 style={{ fontSize: "28px", marginBottom: "16px" }}>
          Speed is leverage.
        </h2>

        <p style={{ color: "#9ca3af", lineHeight: 1.6 }}>
          In fast-moving environments, access is everything. Instead of emailing
          documents, sending links, or asking someone to follow up, your materials
          are delivered instantly — with a single tap or scan.
        </p>
      </section>

      {/* USE CASES */}
      <section style={{ marginBottom: "64px" }}>
        <h2 style={{ fontSize: "28px", marginBottom: "16px" }}>
          Use cases
        </h2>

        <ul style={{ color: "#9ca3af", lineHeight: 1.8 }}>
          <li>Legislative packets and bill briefings</li>
          <li>Committee materials and supporting documents</li>
          <li>Advocacy campaigns and issue rollouts</li>
          <li>Field organizing and stakeholder engagement</li>
          <li>Conferences, hearings, and in-person meetings</li>
        </ul>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ marginBottom: "64px" }}>
        <h2 style={{ fontSize: "28px", marginBottom: "16px" }}>
          How it works
        </h2>

        <ol style={{ color: "#9ca3af", lineHeight: 1.8 }}>
          <li>You define what the card should deliver</li>
          <li>We design and configure the experience</li>
          <li>Cards are printed and pre-programmed</li>
          <li>Your team distributes them immediately</li>
        </ol>
      </section>

      {/* CONTROL */}
      <section style={{ marginBottom: "64px" }}>
        <h2 style={{ fontSize: "28px", marginBottom: "16px" }}>
          Built for control.
        </h2>

        <p style={{ color: "#9ca3af", lineHeight: 1.6 }}>
          Cards can be static or dynamically routed. Destinations can be updated
          after distribution, allowing you to reuse inventory, rotate materials,
          or respond in real time without reprinting.
        </p>
      </section>

      {/* DIFFERENTIATORS */}
      <section style={{ marginBottom: "80px" }}>
        <h2 style={{ fontSize: "28px", marginBottom: "16px" }}>
          What makes it different
        </h2>

        <ul style={{ color: "#9ca3af", lineHeight: 1.8 }}>
          <li>No app required</li>
          <li>No setup for end users</li>
          <li>Works instantly via QR or NFC</li>
          <li>Designed for controlled distribution</li>
          <li>Built for high-trust, high-speed environments</li>
        </ul>
      </section>

      {/* CTA */}
      <section style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: "32px", marginBottom: "16px" }}>
          Stop sending links. Start handing them over.
        </h2>

        <a
          href="mailto:john@signalrefinery.pro" // 👈 change later if needed
          style={{
            display: "inline-block",
            marginTop: "16px",
            padding: "16px 32px",
            borderRadius: "999px",
            background: "#d4af6a",
            color: "#111827",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Request custom setup
        </a>
      </section>
    </main>
  );
}