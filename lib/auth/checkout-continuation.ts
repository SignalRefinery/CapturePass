type CheckoutContinuationOptions = {
  billing?: string | null;
  businessType?: string | null;
  plan?: string | null;
  promoCode?: string | null;
};

function clean(value?: string | null) {
  const trimmed = (value || "").trim();
  return trimmed || null;
}

export function checkoutContinuationPath({
  billing,
  businessType,
  plan,
  promoCode
}: CheckoutContinuationOptions) {
  const cleanPlan = clean(plan);
  if (!cleanPlan) return "/business/pricing";

  const params = new URLSearchParams();
  params.set("plan", cleanPlan);

  const cleanBilling = clean(billing);
  const cleanPromoCode = clean(promoCode);
  const cleanBusinessType = clean(businessType);

  if (cleanBilling) params.set("billing", cleanBilling);
  if (cleanPromoCode) params.set("promo_code", cleanPromoCode);
  if (cleanBusinessType) params.set("business_type", cleanBusinessType);

  return `/api/checkout?${params.toString()}`;
}
