"use client";

import { AffiliateTerms } from "@/components/legal/affiliate-terms";
import Link from "next/link";

type InactiveStateProps = {
  email: string;
};

export function InactiveState({ email }: InactiveStateProps) {
  function handleCheckout(href: string) {
    window.location.assign(href);
  }

  return (
    <section className="dashboard-wrap">
      <div className="dashboard-card">
        <div className="dashboard-kicker">Reserved profile</div>
        <h2>Your profile is preview-only until activation.</h2>
        <p className="editor-copy">
          Your account for <strong>{email}</strong> can build a basic profile now. Choose Business
          Individual for a branded solo-professional profile, or open Business Pricing for team
          plans.
        </p>

        <div className="pricing-grid" style={{ marginTop: 20 }}>
          <div className="card pricing-card featured">
            <div className="plan-label">Business Individual</div>
            <h2>Activate your solo business profile.</h2>
            <div className="plan-price">
              <span className="setup">$99</span>
              <span className="monthly">/ year</span>
            </div>
            <p className="muted">
              Built for solo professionals who need lead capture, branded NFC cards, QR sharing,
              analytics, and CRM-ready exports.
            </p>
            <p className="muted" style={{ marginTop: 8 }}>
              Business Individual launch subscription.
            </p>
            <button
              className="button primary"
              type="button"
              onClick={() => handleCheckout("/business-individual")}
            >
              Open Business Individual
            </button>
          </div>

          <div className="card pricing-card">
            <div className="plan-label">Business Plans</div>
            <h2>Choose a team plan.</h2>
            <div className="plan-price">
              <span className="setup">From $29</span>
              <span className="monthly">/ month</span>
            </div>
            <p className="muted">
              Shared branding, team contact management, reusable seats, and managed options for
              businesses of every size.
            </p>
            <p className="muted" style={{ marginTop: 8 }}>
              Compare business plans and launch pricing on the business pricing page.
            </p>
            <Link className="button secondary" href="/business/pricing">
              View Business Pricing
            </Link>
          </div>
        </div>
      </div>

      <div className="status-bottom">
        <AffiliateTerms />
      </div>
    </section>
  );
}
