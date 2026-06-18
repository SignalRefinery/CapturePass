"use client";

import { AffiliateTerms } from "@/components/legal/affiliate-terms";
import { getPlanDisplayLabel, getPlanPricingDescription, type PlanKey } from "@/lib/plans";

const planCards: Array<{
  key: PlanKey;
  price: string;
  billing: string;
  headline: string;
  description: string;
  cta: string;
  href?: string;
  featured?: boolean;
}> = [
  {
    key: "core",
    price: "$29",
    billing: "/ year",
    headline: "Activate your CapturePass.",
    description: "Physical CapturePass card, NFC sharing, QR sharing, profile link sharing, add-to-contacts, basic customization, and themes.",
    cta: "Get Core"
  },
  {
    key: "tagg_plus",
    price: "$79",
    billing: "/ year",
    headline: "Capture contacts and understand engagement.",
    description: "Everything in Core plus Contact Capture, contacts dashboard, analytics, source tracking, custom buttons, advanced customization, and priority support.",
    cta: "Upgrade to Capture+",
    featured: true
  },
  {
    key: "business_individual",
    price: "$99",
    billing: "/ year",
    headline: "Business Individual.",
    description: "For solo professionals who need lead capture, business branding, a custom printed card, analytics, and onboarding support.",
    cta: "Open Business Individual",
    href: "/business-individual"
  }
];

type InactiveStateProps = {
  email: string;
};

export function InactiveState({ email }: InactiveStateProps) {
  function handleCheckout(plan: PlanKey, href?: string) {
    if (href) {
      window.location.assign(href);
      return;
    }

    window.location.assign(`/api/checkout?plan=${encodeURIComponent(plan)}`);
  }

  return (
    <section className="dashboard-wrap">
      <div className="dashboard-card">
        <div className="dashboard-kicker">Reserved profile</div>
        <h2>Your profile is preview-only until activation.</h2>
        <p className="editor-copy">
          Your account for <strong>{email}</strong> can build a basic profile now. Choose Core
          for card sharing, Capture+ for contact capture and analytics, or Business Individual
          for a branded solo-professional profile.
        </p>

        <div className="pricing-grid" style={{ marginTop: 20 }}>
          {planCards.map((plan) => (
            <div className={`card pricing-card${plan.featured ? " featured" : ""}`} key={plan.key}>
              <div className="plan-label">{getPlanDisplayLabel(plan.key)}</div>
              <h2>{plan.headline}</h2>
              <div className="plan-price">
                <span className="setup">{plan.price}</span>
                <span className="monthly">{plan.billing}</span>
              </div>
              <p className="muted">{plan.description}</p>
              <p className="muted" style={{ marginTop: 8 }}>
                {getPlanPricingDescription(plan.key, { isActivated: true })}
              </p>
              <button className="button primary" type="button" onClick={() => handleCheckout(plan.key, plan.href)}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="status-bottom">
        <AffiliateTerms />
      </div>
    </section>
  );
}
