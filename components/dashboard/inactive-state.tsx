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
  featured?: boolean;
}> = [
  {
    key: "core",
    price: "$29",
    billing: "one-time",
    headline: "Activate your TapTagg.",
    description: "1 card, public profile activation, NFC, QR, expanded links, and basic themes.",
    cta: "Get Core"
  },
  {
    key: "tagg_plus",
    price: "$49",
    billing: "/ year",
    headline: "Add analytics and control.",
    description: "Everything in Core plus advanced customization, analytics, contact sharing insights, and support.",
    cta: "Upgrade to Tagg+",
    featured: true
  },
  {
    key: "creator",
    price: "$99",
    billing: "/ year",
    headline: "Unlock creator modules.",
    description: "Everything in Tagg+ plus multi-view profiles, advanced branding, featured sections, and creator tools.",
    cta: "Start Creator"
  }
];

type InactiveStateProps = {
  email: string;
};

export function InactiveState({ email }: InactiveStateProps) {
  function handleCheckout(plan: PlanKey) {
    window.location.assign(`/api/checkout?plan=${encodeURIComponent(plan)}`);
  }

  return (
    <section className="dashboard-wrap">
      <div className="dashboard-card">
        <div className="dashboard-kicker">Reserved Tagg</div>
        <h2>Your profile is preview-only until activation.</h2>
        <p className="editor-copy">
          Your account for <strong>{email}</strong> can build a basic profile now. Activate Core
          to make it public with QR sharing, or choose a higher plan when you want analytics and advanced tools.
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
              <button className="button primary" type="button" onClick={() => handleCheckout(plan.key)}>
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
