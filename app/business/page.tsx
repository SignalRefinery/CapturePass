import Link from "next/link";
import { redirect } from "next/navigation";
import { Shell } from "@/components/shared/shell";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTapTaggAdmin } from "@/lib/auth/admin";

const selfManagedDescription =
  "Self-managed gives your organization admin access to manage seats, profiles, branding, and card assignments directly.";

const fullyManagedDescription =
  "Fully managed means your team sends us new hires, departures, and profile changes. We handle setup, deactivation, card assignment, seat reassignment, and basic profile updates.";

const businessUseCases = [
  "Sales teams and field reps",
  "Real estate, hospitality, and service teams",
  "Events, conferences, and launches",
  "Restaurants, retail, and local businesses",
  "Recruiting, onboarding, and internal tools",
  "Multi-location brands and franchises"
];

const platformFeatures = [
  "Business-branded TapTagg cards",
  "Permanent /p token URLs that survive employee turnover",
  "Phone-first Digital Pass QR for everyday sharing",
  "Employee activation and deactivation",
  "Card/profile reassignment",
  "Team-ready profile templates",
  "QR and NFC sharing",
  "Contact sharing and export workflows",
  "CRM Ready - Send new TapTagg leads to Zapier, Make, your CRM, email tools, SMS workflows, or custom business systems using outbound webhooks.",
  "Review, booking, menu, and form links",
  "Setup, onboarding, and support"
];

const rolloutSteps = [
  {
    title: "Scope",
    copy: "We map the team size, card count, profile structure, destinations, and launch timeline."
  },
  {
    title: "Configure",
    copy: "TapTagg builds the cards, profile templates, QR/NFC routing, and team-ready defaults."
  },
  {
    title: "Launch",
    copy: "Your team receives activated cards and a repeatable process for updates, replacements, and new hires."
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
      from: "TapTagg <notifications@taptagg.app>",
      to: "john@taptagg.app",
      reply_to: email,
      subject: `TapTagg business inquiry: ${organization}`,
      html: `
        <h2>New TapTagg business / enterprise inquiry</h2>
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
    isAdmin: !!profile?.is_admin || !!(await getCurrentTapTaggAdmin())
  };
}

export default async function BusinessPage({
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
      footerLeft="Business"
      footerRight="TapTagg"
      initialAuth={initialAuth}
      navLinks={[
        { href: "/", label: "Home" },
        { href: "/how-it-works", label: "How it works" },
        { href: "/pricing", label: "Pricing" },
        { href: "/partners", label: "Partners" }
      ]}
    >
      <section className="business-hero">
        <div className="business-hero-content">
          <div className="kicker">
            <span className="mini-star">✦</span>
            <span>Business & Enterprise</span>
          </div>
          <h1>TapTagg for teams that connect in person.</h1>
          <p>
            Permanent card/pass URLs, team profiles, QR/NFC sharing, contact sharing, and rollout support for
            businesses that need every employee, event, or location ready to share.
          </p>
          <div className="business-hero-actions">
            <Link className="button primary" href="/business/pricing">
              View Business Pricing
            </Link>
            <Link className="button secondary" href="/pricing">
              Compare Individual Plans
            </Link>
            <a className="button secondary" href="#business-request">
              Request Business Quote
            </a>
          </div>
        </div>
      </section>

      <section className="business-band">
        <div className="business-metrics" aria-label="Business capabilities">
          <div>
            <span>Team setup</span>
            <strong>Profiles + cards</strong>
          </div>
          <div>
            <span>Sharing</span>
            <strong>Digital Pass QR + NFC</strong>
          </div>
          <div>
            <span>Operations</span>
            <strong>Activate, update, reassign</strong>
          </div>
          <div>
            <span>CRM Ready</span>
            <strong>Outbound webhooks for TapTagg leads</strong>
          </div>
        </div>
      </section>

      <section className="business-section business-two-column">
        <div>
          <div className="dashboard-kicker">Built for teams</div>
          <h2>One business system instead of one-off cards.</h2>
          <p>
            Business TapTagg setups are designed for repeatable operations: new hires,
            replacements, seasonal events, location changes, sales campaigns, and teams that need
            a consistent way to share the right next step. The URL belongs to the card/pass token,
            not an employee name, so reassignment does not require reprinting or retraining.
          </p>
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
          <h2>Cards, profiles, routing, and rollout support.</h2>
        </div>

        <div className="business-feature-grid">
          {platformFeatures.map((feature) => (
            <div className="business-feature" key={feature}>
              {feature}
            </div>
          ))}
        </div>
      </section>

      <section className="business-section business-process">
        <div className="business-section-heading">
          <div className="dashboard-kicker">Rollout</div>
          <h2>A cleaner launch for every cardholder.</h2>
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
        <img src="/custom-taptagg-card.jpg" alt="TapTagg business card" />
        <div>
          <div className="dashboard-kicker">Business ready</div>
          <h2>Branded physical cards with updateable digital destinations.</h2>
          <p>
            NFC cards create the memorable in-person entry point, while the Digital Pass QR is the
            daily-use sharing method on the phone. Permanent token URLs keep the card useful when an
            employee leaves: deactivate, unassign, or reassign the token without changing the URL.
          </p>
        </div>
      </section>

      <section className="business-section">
        <div className="business-section-heading">
          <div className="dashboard-kicker">Business pricing</div>
          <h2>Choose self-managed or fully managed.</h2>
          <p>
            {selfManagedDescription}
          </p>
          <p>
            {fullyManagedDescription}
          </p>
        </div>

        <div className="business-feature-grid">
          <div className="business-feature">Starter: 10 seats, 10 NFC cards, $149 setup</div>
          <div className="business-feature">Growth: 25 seats, 25 NFC cards, $299 setup</div>
          <div className="business-feature">Pro: 50 seats, 50 NFC cards, $499 setup</div>
        </div>
        <Link className="button primary" href="/business/pricing">
          View Business Pricing
        </Link>
      </section>

      <section className="business-section business-request" id="business-request">
        <div className="business-section-heading">
          <div className="dashboard-kicker">Start a business quote</div>
          <h2>Tell us what your team needs.</h2>
          <p>
            Share the team size, use case, and timeline. We will follow up with pricing for cards,
            setup, platform needs, and support.
          </p>
        </div>

        {requestSent ? (
          <div className="business-alert">
            Request received. We will review the details and follow up with a business quote.
          </div>
        ) : null}

        {requestError ? (
          <div className="business-alert is-error">
            {requestError === "missing_fields"
              ? "Please complete your name, organization, email, team size, and business need."
              : requestError === "email_not_configured"
                ? "The form is ready, but email is not configured yet."
                : "The request could not be sent. Please email hello@taptagg.app directly."}
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
                <option value="2-10">2-10</option>
                <option value="11-25">11-25</option>
                <option value="26-100">26-100</option>
                <option value="101-250">101-250</option>
                <option value="250+">250+</option>
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
            Request Business Quote
          </button>
        </form>
      </section>
    </Shell>
  );
}
