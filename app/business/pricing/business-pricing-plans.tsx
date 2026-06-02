"use client";

import { useState } from "react";
import Link from "next/link";

type BillingInterval = "monthly" | "annual";

type PlanOption = {
  annualPrice: number;
  key: string;
  label: string;
  monthlyPrice: number;
};

type BusinessPricingTier = {
  cards: number;
  managed: PlanOption;
  name: string;
  seats: number;
  self: PlanOption;
  setupFee: number;
  tier: string;
};

export function BusinessPricingPlans({ tiers }: { tiers: BusinessPricingTier[] }) {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const isAnnual = billingInterval === "annual";

  return (
    <>
      <div style={billingToggleWrap}>
        <div style={billingToggleLabel}>Billing</div>
        <div style={billingToggle} role="tablist" aria-label="Business billing interval">
          <button
            aria-selected={!isAnnual}
            onClick={() => setBillingInterval("monthly")}
            role="tab"
            style={!isAnnual ? { ...billingToggleButton, ...billingToggleButtonActive } : billingToggleButton}
            type="button"
          >
            Monthly
          </button>
          <button
            aria-selected={isAnnual}
            onClick={() => setBillingInterval("annual")}
            role="tab"
            style={isAnnual ? { ...billingToggleButton, ...billingToggleButtonActive } : billingToggleButton}
            type="button"
          >
            Annual - Save 10%
          </button>
        </div>
        {isAnnual ? <div style={billingSaveNote}>Annual billing uses discounted yearly Stripe prices.</div> : null}
      </div>

      <div style={businessTierGrid}>
        {tiers.map((tier) => (
          <article style={businessTierCard} key={tier.tier}>
            <div>
              <div style={quoteLabel}>{tier.name}</div>
              <div style={quotePrice}>{tier.seats} reusable seats</div>
            </div>

            <div style={businessTierDetails}>
              <div>{tier.cards} NFC cards included at setup</div>
              <div>${tier.setupFee} one-time setup</div>
              <div>Business console, branding, token reassignment, contacts, and analytics</div>
            </div>

            <div style={businessPlanOptions}>
              <PlanChoice option={tier.self} billingInterval={billingInterval} buttonClassName="button primary" />
              <PlanChoice option={tier.managed} billingInterval={billingInterval} buttonClassName="button secondary" />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function PlanChoice({
  billingInterval,
  buttonClassName,
  option
}: {
  billingInterval: BillingInterval;
  buttonClassName: string;
  option: PlanOption;
}) {
  const isAnnual = billingInterval === "annual";
  const price = isAnnual ? `$${option.annualPrice.toLocaleString()}/yr` : `$${option.monthlyPrice}/mo`;
  const href = `/api/checkout?plan=${encodeURIComponent(option.key)}${isAnnual ? "&billing=annual" : ""}`;

  return (
    <div style={businessPlanOption}>
      <div style={planPriceBlock}>
        <strong>{price}</strong>
        <span>{option.label}</span>
        {isAnnual ? <em>Save 10%</em> : null}
      </div>
      <Link className={buttonClassName} href={href}>
        {option.label === "Self-Managed" ? "Start Self-Managed" : "Start Managed"}
      </Link>
    </div>
  );
}

const billingToggleWrap = {
  gridColumn: "1 / -1",
  display: "grid",
  justifyItems: "center",
  gap: 10,
  padding: "6px 0 2px"
};

const billingToggleLabel = {
  color: "#d8ccff",
  fontSize: 13,
  fontWeight: 900,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const
};

const billingToggle = {
  display: "flex",
  flexWrap: "wrap" as const,
  justifyContent: "center",
  gap: 8,
  padding: 7,
  borderRadius: 999,
  border: "1px solid rgba(167,139,250,.32)",
  background: "rgba(8,8,10,.72)",
  boxShadow: "0 18px 46px rgba(0,0,0,.28)"
};

const billingToggleButton = {
  minWidth: 132,
  border: 0,
  borderRadius: 999,
  padding: "11px 16px",
  background: "transparent",
  color: "#b6bcc8",
  cursor: "pointer",
  font: "inherit",
  fontSize: 14,
  fontWeight: 900
};

const billingToggleButtonActive = {
  background: "linear-gradient(135deg, #8b5cf6, #a78bfa)",
  color: "#fff",
  boxShadow: "0 12px 28px rgba(139,92,246,.3)"
};

const billingSaveNote = {
  color: "#d8ccff",
  fontSize: 13,
  fontWeight: 800
};

const businessTierGrid = {
  gridColumn: "1 / -1",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
  gap: 16
};

const businessTierCard = {
  display: "grid",
  gap: 18,
  padding: 22,
  borderRadius: 22,
  border: "1px solid rgba(167,139,250,.28)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,.052), rgba(255,255,255,.018)), rgba(8,8,10,.72)"
};

const quoteLabel = {
  color: "#d8ccff",
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const
};

const quotePrice = {
  fontFamily: "var(--font-heading)",
  fontSize: "clamp(28px, 4vw, 38px)",
  lineHeight: 1,
  letterSpacing: "-0.035em",
  fontWeight: 800
};

const businessTierDetails = {
  display: "grid",
  gap: 8,
  color: "#e5e7eb",
  fontSize: 14,
  lineHeight: 1.45,
  fontWeight: 700
};

const businessPlanOptions = {
  display: "grid",
  gap: 10
};

const businessPlanOption = {
  display: "grid",
  gap: 10,
  padding: 14,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,.1)",
  background: "rgba(255,255,255,.026)"
};

const planPriceBlock = {
  display: "grid",
  gap: 4
};
