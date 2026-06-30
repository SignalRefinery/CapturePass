"use client";

import { useState, type CSSProperties } from "react";
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

const teamSizeDescriptions: Record<string, string> = {
  small_team:
    "For small businesses and growing teams that want professional contact sharing, lead capture, and company branding without enterprise complexity.",
  starter:
    "For growing sales teams that need branded customer interactions and shared lead management.",
  growth:
    "For multi-location businesses that need analytics, reusable employee seats, and CRM workflows.",
  pro:
    "For dealer groups, franchises, brokerages, and larger organizations that want centralized management."
};

const rooftopDescriptions: Record<string, string> = {
  small_team: "1 rooftop / location included",
  starter: "1 rooftop / location included",
  growth: "Up to 3 rooftops / locations included",
  pro: "Up to 10 rooftops / locations included"
};

const sharedPlanFeatures = [
  "Consistent company branding across every employee profile",
  "Instantly reassign cards and profiles when employees change roles",
  "Centralized captured-contact management",
  "Business analytics dashboard",
  "CRM-ready contact delivery and exports"
];

const checkoutButtonStyle = {
  width: "100%",
  justifyContent: "center",
  minHeight: 48,
  borderRadius: 14,
  fontWeight: 950
};

export function BusinessPricingPlans({ tiers }: { tiers: BusinessPricingTier[] }) {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [promoCode, setPromoCode] = useState("");
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

      <div style={promoWrap}>
        <label style={promoLabel}>
          <span style={promoLabelText}>Promo code</span>
          <input
            style={promoInput}
            type="text"
            value={promoCode}
            onChange={(event) => setPromoCode(event.target.value)}
            placeholder="Optional: Enter promo code if you have one"
            autoComplete="off"
          />
        </label>
        <div style={promoHint}>
          Optional: Enter promo code if you have one.
        </div>
      </div>

      <div style={businessTierGrid}>
        {tiers.map((tier) => (
          <article style={businessTierCard} key={tier.tier}>
            <div>
              <div style={quoteLabel}>{tier.name}</div>
              <div style={quotePrice}>{tier.seats} reusable seats</div>
              <p style={businessTierDescription}>{teamSizeDescriptions[tier.tier]}</p>
            </div>

            <div style={businessTierDetails}>
              <div>{tier.cards} NFC cards and mobile QR access included at setup</div>
              <div style={rooftopSupport}>{rooftopDescriptions[tier.tier]}</div>
              <div style={setupFeeWrap}>
                <span>${tier.setupFee} setup</span>
                <strong style={setupFeeWaivedText}>Launch Special</strong>
                <em>Setup fees are currently waived.</em>
                <em>This introductory offer may be modified or discontinued without notice.</em>
              </div>
              {sharedPlanFeatures.map((feature) => (
                <div key={feature}>{feature}</div>
              ))}
            </div>

            <div style={businessPlanOptions}>
              <PlanChoice
                option={tier.self}
                billingInterval={billingInterval}
                buttonClassName="button primary"
                promoCode={promoCode}
                buttonStyle={checkoutButtonStyle}
              />
              <PlanChoice
                option={tier.managed}
                billingInterval={billingInterval}
                buttonClassName="button secondary"
                promoCode={promoCode}
                buttonStyle={checkoutButtonStyle}
              />
            </div>
          </article>
        ))}
      </div>

      <section style={rooftopAddOnCard}>
        <h3 style={addOnHeading}>Need more rooftops?</h3>
        <p style={addOnCopy}>Additional rooftops / locations can be added for $99/month each.</p>
        <p style={addOnSupport}>
          Useful for dealer groups, brokerages, franchises, and businesses with multiple locations.
        </p>
      </section>
    </>
  );
}

function PlanChoice({
  billingInterval,
  buttonClassName,
  option,
  promoCode,
  buttonStyle
}: {
  billingInterval: BillingInterval;
  buttonClassName: string;
  option: PlanOption;
  promoCode: string;
  buttonStyle: CSSProperties;
}) {
  const isAnnual = billingInterval === "annual";
  const price = isAnnual ? `$${option.annualPrice.toLocaleString()}/yr` : `$${option.monthlyPrice}/mo`;
  const hrefParams = new URLSearchParams({ plan: option.key });

  if (isAnnual) hrefParams.set("billing", "annual");
  if (promoCode.trim()) hrefParams.set("promo_code", promoCode.trim().toUpperCase());

  const href = `/api/checkout?${hrefParams.toString()}`;

  return (
    <div style={businessPlanOption}>
      <div style={planPriceBlock}>
        <strong>{price}</strong>
        <span>{option.label}</span>
        {isAnnual ? <em>Save 10%</em> : null}
      </div>
      <Link className={buttonClassName} href={href} style={buttonStyle}>
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
  color: "var(--brand-primary)",
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
  border: "1px solid rgba(37,99,235,.16)",
  background: "rgba(255,255,255,.96)",
  boxShadow: "0 16px 36px rgba(15,23,42,.08)"
};

const billingToggleButton = {
  minWidth: 132,
  border: 0,
  borderRadius: 999,
  padding: "11px 16px",
  background: "transparent",
  color: "#5f6674",
  cursor: "pointer",
  font: "inherit",
  fontSize: 14,
  fontWeight: 900
};

const billingToggleButtonActive = {
  background: "linear-gradient(135deg, var(--brand-primary), var(--brand-deep))",
  color: "#fff",
  boxShadow: "0 12px 28px rgba(var(--brand-primary-rgb),.3)"
};

const billingSaveNote = {
  color: "var(--brand-primary)",
  fontSize: 13,
  fontWeight: 800
};

const promoWrap = {
  gridColumn: "1 / -1",
  display: "grid",
  gap: 10,
  justifyItems: "center",
  padding: "8px 0 2px"
};

const promoLabel = {
  display: "grid",
  gap: 8,
  width: "min(100%, 360px)"
};

const promoLabelText = {
  color: "var(--brand-primary)",
  fontSize: 13,
  fontWeight: 900,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  textAlign: "center" as const
};

const promoInput = {
  width: "100%",
  borderRadius: 14,
  border: "1px solid rgba(37,99,235,.16)",
  background: "#ffffff",
  color: "#0f172a",
  padding: "12px 14px",
  font: "inherit",
  fontSize: 15,
  fontWeight: 700
};

const promoHint = {
  color: "#6b7280",
  fontSize: 13,
  fontWeight: 600,
  textAlign: "center" as const
};

const businessTierGrid = {
  gridColumn: "1 / -1",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
  gap: 22,
  paddingTop: 10
};

const businessTierCard = {
  display: "grid",
  gap: 18,
  padding: 22,
  borderRadius: 24,
  border: "1px solid rgba(37,99,235,.14)",
  boxShadow: "0 24px 70px rgba(15,23,42,.09)",
  background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
  color: "#0f172a"
};

const quoteLabel = {
  color: "var(--brand-primary)",
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const
};

const quotePrice = {
  fontFamily: "var(--font-heading)",
  color: "#2563eb",
  fontSize: "clamp(30px, 4vw, 44px)",
  lineHeight: 1,
  letterSpacing: "-0.035em",
  fontWeight: 800
};

const businessTierDescription = {
  margin: "12px 0 0",
  color: "#5f6674",
  fontSize: 14,
  lineHeight: 1.55,
  fontWeight: 650
};

const businessTierDetails = {
  display: "grid",
  gap: 8,
  color: "#0f172a",
  fontSize: 14,
  lineHeight: 1.45,
  fontWeight: 700
};

const rooftopSupport = {
  padding: "11px 13px",
  borderRadius: 15,
  border: "1px solid rgba(var(--brand-primary-rgb),.14)",
  background: "rgba(var(--brand-primary-rgb),.08)",
  color: "#0f172a",
  fontSize: 14,
  fontWeight: 900
};

const setupFeeWrap = {
  display: "grid",
  gap: 5,
  padding: "12px 13px",
  borderRadius: 16,
  border: "1px solid rgba(var(--brand-success-rgb),.22)",
  background:
    "linear-gradient(135deg, rgba(var(--brand-success-rgb),.1), rgba(var(--brand-primary-rgb),.06))",
  color: "#0f172a"
};

const setupFeeWaivedText = {
  color: "var(--brand-success)",
  fontSize: 14,
  fontWeight: 950,
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const
};

const businessPlanOptions = {
  display: "grid",
  gap: 10
};

const rooftopAddOnCard = {
  gridColumn: "1 / -1",
  display: "grid",
  gap: 8,
  padding: 20,
  borderRadius: 20,
  border: "1px solid rgba(37,99,235,.12)",
  background:
    "linear-gradient(135deg, rgba(var(--brand-primary-rgb),.08), rgba(var(--brand-success-rgb),.06)), #ffffff"
};

const addOnHeading = {
  margin: 0,
  color: "var(--brand-primary)",
  fontSize: "clamp(24px, 3vw, 34px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.03em"
};

const addOnCopy = {
  margin: 0,
  color: "#0f172a",
  fontSize: "clamp(17px, 2vw, 22px)",
  lineHeight: 1.35,
  fontWeight: 900
};

const addOnSupport = {
  margin: 0,
  color: "#6b7280",
  fontSize: 14,
  lineHeight: 1.55,
  fontWeight: 650
};

const businessPlanOption = {
  display: "grid",
  gap: 10,
  padding: 14,
  borderRadius: 16,
  border: "1px solid rgba(37,99,235,.12)",
  background: "#ffffff"
};

const planPriceBlock = {
  display: "grid",
  gap: 4
};
