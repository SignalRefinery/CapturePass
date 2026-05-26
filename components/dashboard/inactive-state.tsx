"use client";

import { AffiliateTerms } from "@/components/legal/affiliate-terms";

type InactiveStateProps = {
  email: string;
};

export function InactiveState({ email }: InactiveStateProps) {
  function handleCheckout(plan: "essential") {
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
          Your account for <strong>{email}</strong> is set up. Activate with Essential now to
          unlock your dashboard. Professional and Premium options are coming soon.
        </p>

        <div className="pricing-grid" style={{ marginTop: 20 }}>
          <div className="card pricing-card">
            <div className="plan-label">Essential</div>
            <h2>Start sharing.</h2>
            <div className="plan-price">
              <span className="setup">$99 setup</span>
              <span className="monthly">$25/mo</span>
            </div>
            <p className="muted">Your TapTagg profile, links, QR, and card connection.</p>
            <button className="button primary" type="button" onClick={() => handleCheckout("essential")}>
              Get Essential
            </button>
          </div>

          <div className="card pricing-card featured">
            <div className="plan-label">Professional</div>
            <h2>Expanded tools are coming soon.</h2>
            <div className="plan-price">
              <span className="setup">$99 setup</span>
              <span className="monthly">$39/mo</span>
            </div>
            <p className="muted">More flexibility and control are planned for a future release.</p>
            <button className="button primary" type="button" disabled aria-disabled="true">
              Coming soon
            </button>
          </div>

          <div className="card pricing-card">
            <div className="plan-label">Premium</div>
            <h2>Advanced tools are coming soon.</h2>
            <div className="plan-price">
              <span className="setup">$99 setup</span>
              <span className="monthly">$49/mo</span>
            </div>
            <p className="muted">More customization, analytics, and team features are planned.</p>
            <button className="button primary" type="button" disabled aria-disabled="true">
              Coming soon
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
