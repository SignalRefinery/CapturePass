"use client";

import { AffiliateTerms } from "@/components/legal/affiliate-terms";

type InactiveStateProps = {
  email: string;
};

export function InactiveState({ email }: InactiveStateProps) {
  function handleCheckout(plan: "core" | "tagg_plus" | "creator") {
    window.location.assign(`/api/checkout?plan=${encodeURIComponent(plan)}`);
  }

  return (
    <section className="dashboard-wrap">
      <div className="dashboard-card">
        <div className="dashboard-kicker">Reserved Tagg</div>
        <h2>Your profile is preview-only until activation.</h2>
        <p className="editor-copy">
          Your account for <strong>{email}</strong> can build a basic profile now. Activate Core
          to make it public, enable NFC and QR sharing, and keep updating your profile anytime.
        </p>

        <div className="pricing-grid" style={{ marginTop: 20 }}>
          <div className="card pricing-card">
            <div className="plan-label">Core</div>
            <h2>Activate your TapTagg.</h2>
            <div className="plan-price">
              <span className="setup">$29</span>
              <span className="monthly">one-time</span>
            </div>
            <p className="muted">1 card, public profile activation, NFC, QR, expanded links, and basic themes.</p>
            <button className="button primary" type="button" onClick={() => handleCheckout("core")}>
              Get Core
            </button>
          </div>

          <div className="card pricing-card featured">
            <div className="plan-label">Tagg+</div>
            <h2>Add capture and control.</h2>
            <div className="plan-price">
              <span className="setup">$49</span>
              <span className="monthly">/ year</span>
            </div>
            <p className="muted">Everything in Core plus advanced customization, analytics, lead capture, and support.</p>
            <button className="button primary" type="button" onClick={() => handleCheckout("tagg_plus")}>
              Upgrade to Tagg+
            </button>
          </div>

          <div className="card pricing-card">
            <div className="plan-label">Creator</div>
            <h2>Unlock creator modules.</h2>
            <div className="plan-price">
              <span className="setup">$99</span>
              <span className="monthly">/ year</span>
            </div>
            <p className="muted">Everything in Tagg+ plus advanced analytics, embeds, exports, redirects, and multiple cards.</p>
            <button className="button primary" type="button" onClick={() => handleCheckout("creator")}>
              Start Creator
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
