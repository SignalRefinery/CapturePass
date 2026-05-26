import Link from "next/link";
import { Shell } from "@/components/shared/shell";
import { createClient } from "@/lib/supabase/server";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://taptagg.app").replace(/\/$/, "");
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
      from: "TapTagg <notifications@taptagg.app>",
      to: "john@taptagg.app",
      reply_to: email,
      subject: `Custom TapTagg request: ${organization || name}`,
      html: `
        <h2>New custom TapTagg project request</h2>
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
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(54px, 7.4vw, 104px)",
  lineHeight: 0.94,
  letterSpacing: "-0.04em",
  fontWeight: 800,
  color: "#ffffff"
};

const lead = {
  maxWidth: 860,
  margin: "0 auto",
  color: "#b6bcc8",
  fontSize: "clamp(18px, 2vw, 24px)",
  lineHeight: 1.55,
  textAlign: "center" as const
};

const sectionTitle = {
  margin: "0 auto 12px",
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(36px, 5vw, 62px)",
  lineHeight: 0.98,
  letterSpacing: "-0.035em",
  fontWeight: 800,
  color: "#ffffff",
  textAlign: "center" as const
};

const copy = {
  color: "#b6bcc8",
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
    "radial-gradient(520px 220px at 12% 0%, rgba(139,92,246,.08), transparent 62%), linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,.014)), linear-gradient(180deg, rgba(15,15,15,.9), rgba(26,26,26,.95))"
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
      footerLeft="TapTagg"
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
          <span>Custom Taggs</span>
        </div>

        <h1 style={heroTitle}>Make Anything One Tap Away.</h1>

        <p style={lead}>
          Custom NFC and QR cards for teams, events, shops, creators, venues, and
          brands that want people to open the right link instantly.
        </p>
      </section>

      <section className="dashboard-wrap" style={{ paddingTop: 0 }}>
        <div className="card" style={{ padding: 16, overflow: "hidden", textAlign: "center" }}>
          <img
            src="/custom-taptagg-card.jpg"
            alt="Custom TapTagg card"
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
          <div className="dashboard-kicker">Built to move</div>
          <h2 style={sectionTitle}>Tap, Scan, Open.</h2>
          <p style={copy}>
            TapTagg custom cards turn physical spaces into instant launch points.
            Send people to menus, drops, files, booking pages, team links, event info,
            product pages, or anything else.
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
              Stop spelling out links. Let people tap.
            </h2>
            <p style={copy}>
              One tap and they&apos;re there. No app install. No manual typing. Custom
              TapTagg cards make your best link easy to open in the moment.
            </p>
          </div>

          <div className="card" style={cardStyle}>
            <div className="dashboard-kicker">Use cases</div>
            <ul style={list}>
              <li>Menus, catalogs, and product pages</li>
              <li>Music, portfolios, and creator links</li>
              <li>Event pages, check-ins, and sign-up forms</li>
              <li>Booking pages, lead forms, and team links</li>
              <li>Launches, counters, tables, and field teams</li>
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
              "We design and configure the tap destination",
              "Cards are printed and pre-programmed",
              "Your team distributes them immediately"
            ].map((step, index) => (
              <div
                key={step}
                style={{
                  border: "1px solid rgba(139,92,246,.2)",
                  borderRadius: 22,
                  padding: 18,
                  background: "rgba(255,255,255,.03)",
                  textAlign: "center"
                }}
              >
                <div className="dashboard-kicker" style={{ marginBottom: 8 }}>
                  Step {index + 1}
                </div>
                <p style={{ ...copy, color: "#ffffff" }}>{step}</p>
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
              One Link Or Easy Updates.
            </h2>
            <p style={copy}>
              Cards can point to one permanent destination or route through an updateable
              link so you can reuse inventory, change campaigns, swap menus, or update
              launches without replacing cards.
            </p>
          </div>

          <div className="card" style={cardStyle}>
            <div className="dashboard-kicker">What you receive</div>
            <ul style={list}>
              <li>Custom QR codes for cards, signs, packaging, tables, and printed materials</li>
              <li>Optional NFC programming for tap access</li>
              <li>Branding aligned to your team, event, shop, product, or creator brand</li>
              <li>Destination setup for links, forms, landing pages, menus, files, or profiles</li>
              <li>Support for static or updateable destinations</li>
            </ul>
          </div>
        </div>

        <div className="card" style={{ ...cardStyle, textAlign: "center" }}>
          <div className="dashboard-kicker" style={{ justifyContent: "center" }}>
            <span>Project QR</span>
          </div>
          <h2 style={sectionTitle}>Make every link easier to reach.</h2>
          <p style={{ ...copy, maxWidth: 760, margin: "0 auto 26px" }}>
            Use QR codes on cards, signs, packaging, handouts, counters, tables,
            and event materials so the right link is always one scan away.
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
              alt="QR code for TapTagg custom cards"
              style={{ width: 190, height: 190, display: "block" }}
            />
          </div>

          <p style={{ ...copy, fontSize: 14 }}>
            Example QR for this page. Your custom cards can point to menus, forms,
            drops, booking pages, files, profiles, shops, or updateable project links.
          </p>
        </div>

        <div className="card" style={{ ...cardStyle, textAlign: "left", padding: 34 }}>
          <div style={{ textAlign: "center" }}>
            <h2 style={sectionTitle}>Request a custom project quote.</h2>
            <p style={{ ...copy, maxWidth: 760, margin: "0 auto 24px" }}>
              Tell us what your cards need to open. Custom projects are quoted individually
              based on card count, destination setup, branding, hosting, and support needs.
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
                color: "#ffffff",
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
                color: "#ffffff",
                textAlign: "center"
              }}
            >
              {requestError === "missing_fields"
                ? "Please complete your name, email, approximate quantity, and use case."
                : requestError === "email_not_configured"
                  ? "The form is ready, but email is not configured yet."
                  : "The request could not be sent. Please email hello@taptagg.app directly."}
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
              <label style={{ display: "grid", gap: 8, color: "#ffffff", fontSize: 14 }}>
                Name
                <input
                  name="name"
                  required
                  style={{
                    border: "1px solid rgba(255,255,255,.12)",
                    borderRadius: 14,
                    padding: "13px 14px",
                    background: "rgba(255,255,255,.06)",
                    color: "#ffffff",
                    fontSize: 16
                  }}
                />
              </label>

              <label style={{ display: "grid", gap: 8, color: "#ffffff", fontSize: 14 }}>
                Organization / brand
                <input
                  name="organization"
                  style={{
                    border: "1px solid rgba(255,255,255,.12)",
                    borderRadius: 14,
                    padding: "13px 14px",
                    background: "rgba(255,255,255,.06)",
                    color: "#ffffff",
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
              <label style={{ display: "grid", gap: 8, color: "#ffffff", fontSize: 14 }}>
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
                    color: "#ffffff",
                    fontSize: 16
                  }}
                />
              </label>

              <label style={{ display: "grid", gap: 8, color: "#ffffff", fontSize: 14 }}>
                Phone
                <input
                  name="phone"
                  type="tel"
                  style={{
                    border: "1px solid rgba(255,255,255,.12)",
                    borderRadius: 14,
                    padding: "13px 14px",
                    background: "rgba(255,255,255,.06)",
                    color: "#ffffff",
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
              <label style={{ display: "grid", gap: 8, color: "#ffffff", fontSize: 14 }}>
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
                    color: "#ffffff",
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

              <label style={{ display: "grid", gap: 8, color: "#ffffff", fontSize: 14 }}>
                Timeline
                <select
                  name="timeline"
                  defaultValue=""
                  style={{
                    border: "1px solid rgba(255,255,255,.12)",
                    borderRadius: 14,
                    padding: "13px 14px",
                    background: "rgba(255,255,255,.06)",
                    color: "#ffffff",
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

            <label style={{ display: "grid", gap: 8, color: "#ffffff", fontSize: 14 }}>
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
                  color: "#ffffff",
                  fontSize: 16
                }}
              >
                <option value="" disabled>Choose a use case</option>
                <option value="Creator or music links">Creator or music links</option>
                <option value="Menu or product catalog">Menu or product catalog</option>
                <option value="Event or launch">Event or launch</option>
                <option value="Team or staff links">Team or staff links</option>
                <option value="Lead capture or booking">Lead capture or booking</option>
                <option value="Business or organization cards">Business or organization cards</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label style={{ display: "grid", gap: 8, color: "#ffffff", fontSize: 14 }}>
              What should the card connect to?
              <select
                name="destination_type"
                defaultValue=""
                style={{
                  border: "1px solid rgba(255,255,255,.12)",
                  borderRadius: 14,
                  padding: "13px 14px",
                  background: "rgba(255,255,255,.06)",
                  color: "#ffffff",
                  fontSize: 16
                }}
              >
                <option value="">Not sure yet</option>
                <option value="Profile or link page">Profile or link page</option>
                <option value="Menu, catalog, or shop">Menu, catalog, or shop</option>
                <option value="File or document folder">File or document folder</option>
                <option value="Custom landing page">Custom landing page</option>
                <option value="External website">External website</option>
                <option value="Multiple destinations">Multiple destinations</option>
                <option value="Updateable redirect">Updateable redirect</option>
              </select>
            </label>

            <label style={{ display: "grid", gap: 8, color: "#ffffff", fontSize: 14 }}>
              Project notes
              <textarea
                name="notes"
                rows={5}
                placeholder="Tell us about the audience, destination, deadline, branding needs, or any special requirements."
                style={{
                  border: "1px solid rgba(255,255,255,.12)",
                  borderRadius: 14,
                  padding: "13px 14px",
                  background: "rgba(255,255,255,.06)",
                  color: "#ffffff",
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
