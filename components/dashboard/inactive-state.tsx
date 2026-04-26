"use client";

import { AffiliateTerms } from "@/components/legal/affiliate-terms";

type InactiveStateProps = {
  email: string;
};

export function InactiveState({ email }: InactiveStateProps) {
  function handleCheckout(plan: "essential" | "professional" | "premium") {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/checkout";
    form.style.display = "none";

    const planInput = document.createElement("input");
    planInput.type = "hidden";
    planInput.name = "plan";
    planInput.value = plan;

    form.appendChild(planInput);
    document.body.appendChild(form);
    form.submit();
  }

  return (
    <section className="dashboard-wrap">
      <div className="dashboard-card">
        <div className="dashboard-kicker">Activation required</div>
        <h2>Complete activation to unlock the full dashboard.</h2>
        <p className="editor-copy">
          Your account for <strong>{email}</strong> is set up. Choose the plan that fits how you
          intend to use your profile and continue from there.
        </p>

        <div className="pricing-grid" style={{ marginTop: 20 }}>
          <div className="card pricing-card">
            <div className="plan-label">Essential</div>
            <h2>Low-touch coverage.</h2>
            <div className="plan-price">
              <span className="setup">$99 setup</span>
              <span className="monthly">$25/mo</span>
            </div>
            <p className="muted">Simple, credible, and ready to use.</p>
            <button className="button primary" type="button" onClick={() => handleCheckout("essential")}>
              Get Essential
            </button>
          </div>

          <div className="card pricing-card featured">
            <div className="plan-label">Professional</div>
            <h2>Most active accounts live here.</h2>
            <div className="plan-price">
              <span className="setup">$99 setup</span>
              <span className="monthly">$39/mo</span>
            </div>
            <p className="muted">More flexibility, more control, more surface area.</p>
            <button className="button primary" type="button" onClick={() => handleCheckout("professional")}>
              Choose Professional
            </button>
          </div>

          <div className="card pricing-card">
            <div className="plan-label">Premium</div>
            <h2>Concierge-level management.</h2>
            <div className="plan-price">
              <span className="setup">$99 setup</span>
              <span className="monthly">$49/mo</span>
            </div>
            <p className="muted">Handled end-to-end with priority support.</p>
            <button className="button primary" type="button" onClick={() => handleCheckout("premium")}>
              Go Premium
            </button>
          </div>
        </div>
      </div>

      <div className="status-bottom">
        <AffiliateTerms />
      </div>
    </section>
  );
}
