import Link from "next/link";
import { redirect } from "next/navigation";
import { Shell } from "@/components/shared/shell";
import { JsonLd } from "@/components/seo/json-ld";
import { buildPageMetadata, buildSoftwareApplicationJsonLd, SITE_DESCRIPTION } from "@/lib/seo";

export const metadata = buildPageMetadata({
  description:
    "CapturePass for sales teams, dealerships, real estate teams, insurance agents, and field sales organizations that need contact capture and lead ownership.",
  path: "/business",
  title: "Business"
});

const businessUseCases = [
  "Auto dealerships and BHPH lots",
  "Real estate brokerages and agents",
  "Insurance and financial representatives",
  "Home services and field teams",
  "Restaurants, hospitality, and retail",
  "Events, conferences, and recruiting"
];

const platformFeatures = [
  "Save contact information instantly",
  "Capture customer contact details",
  "Schedule appointments",
  "Start phone calls and text conversations",
  "Share listings, inventory, menus, and offers",
  "Route leads into existing systems",
  "Manage employee profiles",
  "Reassign cards without reprinting",
  "Track engagement and activity",
  "Maintain consistent branding"
];

const rolloutSteps = [
  {
    title: "Keep Customers Connected",
    copy: "Customers save the right employee instantly."
  },
  {
    title: "Capture More Opportunities",
    copy: "Turn conversations into contacts and follow-up opportunities."
  },
  {
    title: "Protect Against Turnover",
    copy: "Reassign cards and profiles without reprinting materials."
  }
];

const proofPoints = [
  {
    label: "Customer saves contact",
    before: "Paper card gets lost",
    value: "One tap",
    copy: "Customers save the right employee before they leave the lot, open house, counter, or appointment."
  },
  {
    label: "Lead captured",
    before: "Conversation disappears",
    value: "Follow-up ready",
    copy: "Your team can turn real-world conversations into contact records and next-step opportunities."
  },
  {
    label: "Card reassigned",
    before: "Employee turnover wastes cards",
    value: "No reprint",
    copy: "Reusable cards and profiles can move with your team instead of forcing new print runs."
  },
  {
    label: "Relationship protected",
    before: "Contacts leave with people",
    value: "Team owned",
    copy: "Customer relationships stay connected to your business, not just someone's pocket."
  }
];

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function submitBusinessRequest(formData: FormData) {
  "use server";

  const name = String(formData.get("name") || "").trim();
  const organization = String(formData.get("organization") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const teamSize = String(formData.get("team_size") || "").trim();
  const interest = String(formData.get("interest") || "").trim();
  const timeline = String(formData.get("timeline") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!name || !organization || !email || !teamSize || !interest) {
    redirect("/business?request_error=missing_fields");
  }

  if (!process.env.RESEND_API_KEY) {
    redirect("/business?request_error=email_not_configured");
  }

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "CapturePass <notifications@capturepass.com>",
      to: "support@capturepass.com",
      reply_to: email,
      subject: `CapturePass business inquiry: ${organization}`,
      html: `
        <h2>New CapturePass business / enterprise inquiry</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Organization:</strong> ${escapeHtml(organization)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${phone ? escapeHtml(phone) : "—"}</p>
        <p><strong>Team / card count:</strong> ${escapeHtml(teamSize)}</p>
        <p><strong>Interest:</strong> ${escapeHtml(interest)}</p>
        <p><strong>Timeline:</strong> ${timeline ? escapeHtml(timeline) : "—"}</p>
        <p><strong>Notes:</strong><br />${notes ? escapeHtml(notes).replace(/\n/g, "<br />") : "—"}</p>
      `
    })
  });

  if (!resendResponse.ok) {
    redirect("/business?request_error=email_failed");
  }

  redirect("/business?request_sent=1");
}

const softwareApplicationSchema = buildSoftwareApplicationJsonLd({
  description: SITE_DESCRIPTION,
  name: "CapturePass for Business",
  path: "/business"
});

export default async function BusinessPage({
  searchParams
}: {
  searchParams?: Promise<{
    request_sent?: string;
    request_error?: string;
  }>;
}) {
  const params = searchParams ? await searchParams : {};
  const requestSent = params?.request_sent === "1";
  const requestError = params?.request_error || null;

  return (
    <Shell
      footerLeft="Business"
      footerRight="CapturePass"
      pageVariant="light"
      navLinks={[
        { href: "/", label: "Home" },
        { href: "/how-it-works", label: "How it works" },
        { href: "/business/pricing", label: "Business Pricing" },
        { href: "/partners", label: "Partners" },
        { href: "/contact-capture-nfc-cards", label: "Contact Capture" }
      ]}
    >
      <JsonLd data={softwareApplicationSchema} />

      <section className="business-hero">
        <div className="business-hero-content">
          <div className="kicker">
            <span className="mini-star">✦</span>
            <span>For Sales Teams</span>
          </div>
          <h1>CapturePass for sales teams that meet customers face-to-face.</h1>
          <p className="business-hero-tagline">Turn every customer interaction into a saved contact.</p>
          <p>
            CapturePass helps teams capture contacts, share information instantly, and keep relationship ownership
            connected to the business. Give every employee a branded profile, CRM-ready follow-up, and reusable cards
            that turn face-to-face conversations into trackable opportunities.
          </p>
          <div className="business-hero-actions">
            <Link className="button primary" href="/business/pricing">
              View Business Pricing
            </Link>
            <Link className="button secondary" href="#team-use-cases">
              See Contact Capture in Action
            </Link>
            <a className="button secondary" href="#business-request">
              Request a Demo
            </a>
          </div>
        </div>
      </section>

      <section className="business-band">
        <div className="business-metrics" aria-label="Business capabilities">
          <div>
            <span>Stay Connected</span>
            <strong>Customers save the right employee instantly</strong>
          </div>
          <div>
            <span>Capture Leads</span>
            <strong>Collect contact information in seconds</strong>
          </div>
          <div>
            <span>Keep Ownership</span>
            <strong>Cards survive employee turnover</strong>
          </div>
          <div>
            <span>Work With Existing Systems</span>
            <strong>No CRM replacement required</strong>
          </div>
        </div>
      </section>

      <section className="business-section business-two-column" id="team-use-cases">
        <div>
          <div className="dashboard-kicker">Built for teams</div>
          <h2>Not another CRM. The contact capture layer before the CRM.</h2>
          <p>Most businesses already have a CRM. The problem happens before the CRM.</p>
          <p>Customers forget business cards. Salespeople lose contact information. Conversations never become follow-up opportunities.</p>
          <p>CapturePass helps your team capture contact information, share the right next step, and keep customers connected after they walk away.</p>
        </div>

        <div className="business-list-grid">
          {businessUseCases.map((item) => (
            <div className="business-list-item" key={item}>
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="business-section">
        <div className="business-section-heading">
          <div className="dashboard-kicker">What can be included</div>
          <h2>Built for the moments that create revenue.</h2>
        </div>

        <div className="business-feature-grid">
          {platformFeatures.map((feature) => (
            <div className="business-feature" key={feature}>
              {feature}
            </div>
          ))}
        </div>
      </section>

      <section className="business-section">
        <div className="card tagg-card" style={{ padding: 28 }}>
          <div className="dashboard-kicker">Industry pages</div>
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
            See CapturePass by industry.
          </h2>
          <p style={{ margin: 0, color: "#b6bcc8", fontSize: 16, lineHeight: 1.62, fontWeight: 500 }}>
            Explore tailored pages for dealerships, real estate agents, insurance agents, sales teams,
            and NFC contact capture cards.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 18 }}>
            <Link className="button secondary" href="/dealerships">
              Dealerships
            </Link>
            <Link className="button secondary" href="/real-estate-agents">
              Real Estate Agents
            </Link>
            <Link className="button secondary" href="/insurance-agents">
              Insurance Agents
            </Link>
            <Link className="button secondary" href="/sales-teams">
              Sales Teams
            </Link>
            <Link className="button secondary" href="/contact-capture-nfc-cards">
              Contact Capture NFC Cards
            </Link>
          </div>
        </div>
      </section>

      <section className="business-section">
        <div className="card tagg-card" style={{ padding: 28 }}>
          <div className="dashboard-kicker">Resources</div>
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
            Read the CapturePass playbook.
          </h2>
          <p style={{ margin: 0, color: "#b6bcc8", fontSize: 16, lineHeight: 1.62, fontWeight: 500 }}>
            Explore guides on NFC business cards, contact capture, and industry-specific workflows for teams
            that want stronger follow-up.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 18 }}>
            <Link className="button secondary" href="/resources">
              Resource Center
            </Link>
            <Link className="button secondary" href="/resources/category/dealerships">
              Dealership Resources
            </Link>
            <Link className="button secondary" href="/resources/category/real-estate">
              Real Estate Resources
            </Link>
            <Link className="button secondary" href="/resources/category/sales">
              Sales Resources
            </Link>
          </div>
        </div>
      </section>

      <section className="business-section business-process">
        <div className="business-section-heading">
          <div className="dashboard-kicker">Why teams choose CapturePass</div>
          <h2>Built around the moments your team cannot afford to lose.</h2>
        </div>

        <div className="business-process-grid">
          {rolloutSteps.map((step, index) => (
            <article className="business-process-step" key={step.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="business-section business-proof">
        <div className="business-proof-panel" aria-label="Business proof points">
          <div className="business-proof-intro">
            <div className="dashboard-kicker">What changes</div>
            <h3>From missed follow-up to owned relationships.</h3>
            <p>
            CapturePass closes the gap between a good face-to-face conversation and an actual saved contact your team can act on.
            </p>
          </div>

          <div className="business-proof-grid">
            {proofPoints.map((point, index) => (
              <article className="business-proof-point" key={point.label}>
                <div className="business-proof-point-top">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{point.label}</p>
                </div>
                <div className="business-proof-shift">
                  <small>{point.before}</small>
                  <strong>{point.value}</strong>
                </div>
                <p>{point.copy}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="business-proof-copy">
          <div className="dashboard-kicker">Business ready</div>
          <h2>Your customers remember the conversation. Make sure they remember who to call.</h2>
          <p>
            CapturePass combines physical NFC cards, QR sharing, and digital profiles so customers can save the right salesperson, agent, or team member instantly. When employees leave, cards and profiles can be reassigned without replacing printed materials, which protects relationship ownership and team accountability.
          </p>
          <div className="business-proof-checks" aria-label="Business-ready outcomes">
            <span>Contact saved</span>
            <span>Lead captured</span>
            <span>Card reused</span>
            <span>Relationship retained</span>
          </div>
        </div>
      </section>

      <section className="business-section">
        <div className="business-section-heading">
          <div className="dashboard-kicker">Built for your industry</div>
          <h2>Different businesses. Same problem.</h2>
          <p>People still lose business cards, forget contact information, and struggle to reconnect after a conversation. CapturePass helps solve that problem across industries by making contact capture the first step.</p>
        </div>

        <details className="business-industry-item">
          <summary>Auto Dealerships</summary>
          <p>Customers lose business cards. Salespeople change stores. Referrals don&apos;t always reach the original salesperson. Customers call the dealership instead of the rep they trust.</p>
          <p><strong>CapturePass helps keep customers connected to the salesperson they already chose.</strong></p>
        </details>

        <details className="business-industry-item">
          <summary>Real Estate</summary>
          <p>Open house visitors don&apos;t always become contacts. Referral partners need easy access to your information. Listings change constantly. Agents need a fast way to share information.</p>
          <p><strong>CapturePass helps agents capture leads and stay connected with referral sources.</strong></p>
        </details>

        <details className="business-industry-item">
          <summary>Insurance & Financial Services</summary>
          <p>Trust-based sales require long-term relationships. Referrals drive growth. Follow-up cycles are often measured in months or years.</p>
          <p><strong>CapturePass makes it easy for clients to save your information and reconnect when they&apos;re ready.</strong></p>
        </details>

        <details className="business-industry-item">
          <summary>Home Services</summary>
          <p>Technicians and estimators meet customers in person. Customers often need service later. Reviews and referrals are critical.</p>
          <p><strong>CapturePass keeps your team one tap away.</strong></p>
        </details>

        <details className="business-industry-item">
          <summary>Restaurants & Hospitality</summary>
          <p>Promote reviews, share menus, drive loyalty programs, and capture event inquiries.</p>
          <p><strong>Turn every guest interaction into a future connection.</strong></p>
        </details>

        <details className="business-industry-item">
          <summary>Events & Recruiting</summary>
          <p>Business cards get lost. Networking happens quickly. Follow-up determines success.</p>
          <p><strong>Capture connections before they disappear.</strong></p>
        </details>
      </section>

      <section className="business-section business-request" id="business-request">
        <div className="business-section-heading">
          <div className="dashboard-kicker">Request a demo</div>
          <h2>Let&apos;s talk about your sales process.</h2>
          <p>
            Whether you have three employees or hundreds, we&apos;ll help design a CapturePass rollout that fits your team, customer journey, and follow-up process.
          </p>
        </div>

        {requestSent ? (
          <div className="business-alert">
            Request received. We will review the details and follow up with a demo.
          </div>
        ) : null}

        {requestError ? (
          <div className="business-alert is-error">
            {requestError === "missing_fields"
              ? "Please complete your name, organization, email, team size, and business need."
              : requestError === "email_not_configured"
                ? "The form is ready, but email is not configured yet."
                : "The request could not be sent. Please email support@capturepass.com directly."}
          </div>
        ) : null}

        <form action={submitBusinessRequest} className="business-form">
          <div className="business-form-grid">
            <label>
              <span>Name</span>
              <input name="name" required />
            </label>

            <label>
              <span>Organization</span>
              <input name="organization" required />
            </label>
          </div>

          <div className="business-form-grid">
            <label>
              <span>Email</span>
              <input name="email" type="email" required />
            </label>

            <label>
              <span>Phone</span>
              <input name="phone" type="tel" />
            </label>
          </div>

          <div className="business-form-grid">
            <label>
              <span>Team / card count</span>
              <select name="team_size" required defaultValue="">
                <option value="" disabled>
                  Choose a range
                </option>
                <option value="2-5">2-5</option>
                <option value="6-10">6-10</option>
                <option value="11-25">11-25</option>
                <option value="26-50">26-50</option>
                <option value="50+">50+</option>
              </select>
            </label>

            <label>
              <span>Timeline</span>
              <select name="timeline" defaultValue="">
                <option value="">Not sure yet</option>
                <option value="ASAP">ASAP</option>
                <option value="1-2 weeks">1-2 weeks</option>
                <option value="3-4 weeks">3-4 weeks</option>
                <option value="1-2 months">1-2 months</option>
              </select>
            </label>
          </div>

          <label>
            <span>Business need</span>
            <select name="interest" required defaultValue="">
              <option value="" disabled>
                Choose the closest fit
              </option>
              <option value="Team cards and employee profiles">Team cards and employee profiles</option>
              <option value="Contact sharing and export">Contact sharing and export</option>
              <option value="Events, launches, or conferences">Events, launches, or conferences</option>
              <option value="Review, booking, menu, or product links">Review, booking, menu, or product links</option>
              <option value="Custom branded rollout">Custom branded rollout</option>
              <option value="Enterprise / multi-location program">Enterprise / multi-location program</option>
            </select>
          </label>

          <label>
            <span>Notes</span>
            <textarea
              name="notes"
              rows={5}
              placeholder="Tell us about cardholders, destinations, branding, locations, launch dates, or systems you need to connect."
            />
          </label>

          <button className="button primary" type="submit">
            Request a Demo
          </button>
        </form>
      </section>
    </Shell>
  );
}
