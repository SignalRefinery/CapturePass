import Link from "next/link";
import { Shell } from "@/components/shared/shell";
import { createClient } from "@/lib/supabase/server";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://signal-pass.vercel.app").replace(/\/$/, "");
const customPageUrl = `${siteUrl}/custom`;
const customPageQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=440x440&data=${encodeURIComponent(customPageUrl)}`;

async function submitCustomProjectRequest(formData: FormData) {
  "use server";

  const name = String(formData.get("name") || "").trim();
  const organization = String(formData.get("organization") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const quantity = String(formData.get("quantity") || "").trim();
  const useCase = String(formData.get("use_case") || "").trim();
  const destinationType = String(formData.get("destination_type") || "").trim();
  const timeline = String(formData.get("timeline") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!name || !email || !quantity || !useCase) {
    return { ok: false, error: "missing_fields" };
  }

  if (!process.env.RESEND_API_KEY) {
    return { ok: false, error: "email_not_configured" };
  }

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "SignalPass <notifications@signalpass.app>",
      to: ["john@signalpass.app", "john@signalrefinery.pro"],
      reply_to: email,
      subject: `Custom SignalPass request: ${organization || name}`,
      html: `
        <h2>New custom SignalPass project request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Organization:</strong> ${organization || "—"}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "—"}</p>
        <p><strong>Approximate card quantity:</strong> ${quantity}</p>
        <p><strong>Use case:</strong> ${useCase}</p>
        <p><strong>Destination type:</strong> ${destinationType || "—"}</p>
        <p><strong>Timeline:</strong> ${timeline || "—"}</p>
        <p><strong>Project notes:</strong><br />${notes ? notes.replace(/\n/g, "<br />") : "—"}</p>
      `
    })
  });

  if (!resendResponse.ok) {
    return { ok: false, error: "email_failed" };
  }

  return { ok: true, error: null };
}

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
  lineHeight: 1.55,
  textAlign: "center" as const
};

const sectionTitle = {
  margin: "0 auto 12px",
  fontFamily: '"Cormorant Garamond", Georgia, serif',
  fontSize: "clamp(36px, 5vw, 62px)",
  lineHeight: 0.95,
  letterSpacing: "-0.03em",
  color: "#f4efe3",
  textAlign: "center" as const
};

const copy = {
  color: "var(--muted)",
  fontSize: 17,
  lineHeight: 1.75,
  margin: "0 auto",
  maxWidth: 860,
  textAlign: "center" as const
};

const list = {
  display: "grid",
  gap: 12,
  margin: "18px auto 0",
  padding: 0,
  listStyle: "none",
  color: "var(--muted)",
  fontSize: 16,
  lineHeight: 1.5,
  maxWidth: 720,
  textAlign: "center" as const
};

const cardStyle = {
  padding: 28,
  textAlign: "center" as const,
  background:
    "radial-gradient(520px 220px at 12% 0%, rgba(201,164,92,.12), transparent 62%), linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,.014)), linear-gradient(180deg, rgba(11,20,35,.86), rgba(7,16,28,.94))"
};

async function submitCustomProjectRequestAndRedirect(formData: FormData) {
  "use server";

  const result = await submitCustomProjectRequest(formData);

  if (!result.ok) {
    const error = result.error || "unknown";
    const { redirect } = await import("next/navigation");
    redirect(`/custom?request_error=${encodeURIComponent(error)}`);
  }

  const { redirect } = await import("next/navigation");
  redirect("/custom?request_sent=1");
}

export default async function CustomPage({
  searchParams
}: {
  searchParams?: Promise<{
    request_sent?: string;
    request_error?: string;
  }>;
}) {
  const initialAuth = await getInitialAuth();
  const params = searchParams ? await searchParams : {};
  const requestSent = params?.request_sent === "1";
  const requestError = params?.request_error || null;

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
      <section className="simple-hero" style={{ paddingBottom: 36, textAlign: "center" }}>
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
        <div className="card" style={{ padding: 16, overflow: "hidden", textAlign: "center" }}>
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
                  background: "rgba(255,255,255,.03)",
                  textAlign: "center"
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

        <div className="card" style={{ ...cardStyle, textAlign: "left", padding: 34 }}>
          <div style={{ textAlign: "center" }}>
            <h2 style={sectionTitle}>Request a custom project quote.</h2>
            <p style={{ ...copy, maxWidth: 760, margin: "0 auto 24px" }}>
              Tell us what your cards need to deliver. Custom projects are quoted individually
              based on card count, destination setup, branding, hosting, and managed support.
            </p>
          </div>

          {requestSent ? (
            <div
              style={{
                maxWidth: 820,
                margin: "0 auto 22px",
                border: "1px solid rgba(201,164,92,.28)",
                borderRadius: 18,
                padding: 18,
                background: "rgba(201,164,92,.08)",
                color: "#f4efe3",
                textAlign: "center"
              }}
            >
              Request received. We will review the project details and follow up with a custom quote.
            </div>
          ) : null}

          {requestError ? (
            <div
              style={{
                maxWidth: 820,
                margin: "0 auto 22px",
                border: "1px solid rgba(255,130,130,.35)",
                borderRadius: 18,
                padding: 18,
                background: "rgba(255,90,90,.08)",
                color: "#f4efe3",
                textAlign: "center"
              }}
            >
              {requestError === "missing_fields"
                ? "Please complete your name, email, approximate quantity, and use case."
                : requestError === "email_not_configured"
                  ? "The form is ready, but email is not configured yet."
                  : "The request could not be sent. Please email john@signalrefinery.pro directly."}
            </div>
          ) : null}

          <form
            action={submitCustomProjectRequestAndRedirect}
            style={{
              maxWidth: 920,
              margin: "0 auto",
              display: "grid",
              gap: 16
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 16
              }}
            >
              <label style={{ display: "grid", gap: 8, color: "#f4efe3", fontSize: 14 }}>
                Name
                <input
                  name="name"
                  required
                  style={{
                    border: "1px solid rgba(255,255,255,.12)",
                    borderRadius: 14,
                    padding: "13px 14px",
                    background: "rgba(255,255,255,.06)",
                    color: "#f4efe3",
                    fontSize: 16
                  }}
                />
              </label>

              <label style={{ display: "grid", gap: 8, color: "#f4efe3", fontSize: 14 }}>
                Organization / campaign
                <input
                  name="organization"
                  style={{
                    border: "1px solid rgba(255,255,255,.12)",
                    borderRadius: 14,
                    padding: "13px 14px",
                    background: "rgba(255,255,255,.06)",
                    color: "#f4efe3",
                    fontSize: 16
                  }}
                />
              </label>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 16
              }}
            >
              <label style={{ display: "grid", gap: 8, color: "#f4efe3", fontSize: 14 }}>
                Email
                <input
                  name="email"
                  type="email"
                  required
                  style={{
                    border: "1px solid rgba(255,255,255,.12)",
                    borderRadius: 14,
                    padding: "13px 14px",
                    background: "rgba(255,255,255,.06)",
                    color: "#f4efe3",
                    fontSize: 16
                  }}
                />
              </label>

              <label style={{ display: "grid", gap: 8, color: "#f4efe3", fontSize: 14 }}>
                Phone
                <input
                  name="phone"
                  type="tel"
                  style={{
                    border: "1px solid rgba(255,255,255,.12)",
                    borderRadius: 14,
                    padding: "13px 14px",
                    background: "rgba(255,255,255,.06)",
                    color: "#f4efe3",
                    fontSize: 16
                  }}
                />
              </label>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 16
              }}
            >
              <label style={{ display: "grid", gap: 8, color: "#f4efe3", fontSize: 14 }}>
                Approximate card quantity
                <select
                  name="quantity"
                  required
                  defaultValue=""
                  style={{
                    border: "1px solid rgba(255,255,255,.12)",
                    borderRadius: 14,
                    padding: "13px 14px",
                    background: "rgba(255,255,255,.06)",
                    color: "#f4efe3",
                    fontSize: 16
                  }}
                >
                  <option value="" disabled>Choose a range</option>
                  <option value="1-25">1–25</option>
                  <option value="26-100">26–100</option>
                  <option value="101-250">101–250</option>
                  <option value="251-500">251–500</option>
                  <option value="500+">500+</option>
                </select>
              </label>

              <label style={{ display: "grid", gap: 8, color: "#f4efe3", fontSize: 14 }}>
                Timeline
                <select
                  name="timeline"
                  defaultValue=""
                  style={{
                    border: "1px solid rgba(255,255,255,.12)",
                    borderRadius: 14,
                    padding: "13px 14px",
                    background: "rgba(255,255,255,.06)",
                    color: "#f4efe3",
                    fontSize: 16
                  }}
                >
                  <option value="">Not sure yet</option>
                  <option value="ASAP">ASAP</option>
                  <option value="1-2 weeks">1–2 weeks</option>
                  <option value="3-4 weeks">3–4 weeks</option>
                  <option value="1-2 months">1–2 months</option>
                </select>
              </label>
            </div>

            <label style={{ display: "grid", gap: 8, color: "#f4efe3", fontSize: 14 }}>
              Use case
              <select
                name="use_case"
                required
                defaultValue=""
                style={{
                  border: "1px solid rgba(255,255,255,.12)",
                  borderRadius: 14,
                  padding: "13px 14px",
                  background: "rgba(255,255,255,.06)",
                  color: "#f4efe3",
                  fontSize: 16
                }}
              >
                <option value="" disabled>Choose a use case</option>
                <option value="Legislative packets">Legislative packets</option>
                <option value="Advocacy campaign">Advocacy campaign</option>
                <option value="Lobby day or event">Lobby day or event</option>
                <option value="Staff or member access">Staff or member access</option>
                <option value="Campaign field use">Campaign field use</option>
                <option value="Business or organization cards">Business or organization cards</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label style={{ display: "grid", gap: 8, color: "#f4efe3", fontSize: 14 }}>
              What should the card connect to?
              <select
                name="destination_type"
                defaultValue=""
                style={{
                  border: "1px solid rgba(255,255,255,.12)",
                  borderRadius: 14,
                  padding: "13px 14px",
                  background: "rgba(255,255,255,.06)",
                  color: "#f4efe3",
                  fontSize: 16
                }}
              >
                <option value="">Not sure yet</option>
                <option value="PDF or legislative packet">PDF or legislative packet</option>
                <option value="Document folder">Document folder</option>
                <option value="Custom landing page">Custom landing page</option>
                <option value="External website">External website</option>
                <option value="Multiple destinations">Multiple destinations</option>
                <option value="Updateable redirect">Updateable redirect</option>
              </select>
            </label>

            <label style={{ display: "grid", gap: 8, color: "#f4efe3", fontSize: 14 }}>
              Project notes
              <textarea
                name="notes"
                rows={5}
                placeholder="Tell us about the audience, materials, deadlines, branding needs, or any special requirements."
                style={{
                  border: "1px solid rgba(255,255,255,.12)",
                  borderRadius: 14,
                  padding: "13px 14px",
                  background: "rgba(255,255,255,.06)",
                  color: "#f4efe3",
                  fontSize: 16,
                  resize: "vertical"
                }}
              />
            </label>

            <div style={{ textAlign: "center", marginTop: 6 }}>
              <button className="button primary" type="submit">
                Request custom quote
              </button>
            </div>
          </form>
        </div>
      </section>
    </Shell>
  );
}