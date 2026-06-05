export const BUSINESS_TYPES = [
  "automotive_dealership",
  "real_estate_brokerage",
  "insurance_agency",
  "mortgage_lender",
  "staffing_recruiting",
  "financial_advisor",
  "general_business"
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  automotive_dealership: "Auto Dealerships",
  real_estate_brokerage: "Real Estate Brokerages",
  insurance_agency: "Insurance Agencies",
  mortgage_lender: "Mortgage Lenders",
  staffing_recruiting: "Staffing & Recruiting Firms",
  financial_advisor: "Financial Advisors",
  general_business: "General Business"
};

export const BUSINESS_TYPE_DESCRIPTIONS: Record<BusinessType, string> = {
  automotive_dealership: "Vehicle sales, service, and dealership operations.",
  real_estate_brokerage: "Brokerages, agents, and property advisory teams.",
  insurance_agency: "Independent insurance agencies and brokers.",
  mortgage_lender: "Mortgage lenders, brokers, and loan officers.",
  staffing_recruiting: "Staffing firms, recruiters, and talent agencies.",
  financial_advisor: "Financial advisors, wealth managers, and planners.",
  general_business: "Any business that does not need a vertical-specific setup yet."
};

export function normalizeBusinessType(value?: string | null): BusinessType {
  switch (value) {
    case "automotive_dealership":
    case "real_estate_brokerage":
    case "insurance_agency":
    case "mortgage_lender":
    case "staffing_recruiting":
    case "financial_advisor":
    case "general_business":
      return value;
    default:
      return "general_business";
  }
}

export function getBusinessTypeLabel(value?: string | null) {
  return BUSINESS_TYPE_LABELS[normalizeBusinessType(value)];
}

export function isAutomotiveBusiness(value?: string | null) {
  return normalizeBusinessType(value) === "automotive_dealership";
}

export function isRealEstateBusiness(value?: string | null) {
  return normalizeBusinessType(value) === "real_estate_brokerage";
}

export function isInsuranceBusiness(value?: string | null) {
  return normalizeBusinessType(value) === "insurance_agency";
}

export function isMortgageBusiness(value?: string | null) {
  return normalizeBusinessType(value) === "mortgage_lender";
}

export function isRecruitingBusiness(value?: string | null) {
  return normalizeBusinessType(value) === "staffing_recruiting";
}

export function isFinancialAdvisorBusiness(value?: string | null) {
  return normalizeBusinessType(value) === "financial_advisor";
}

export function isGeneralBusiness(value?: string | null) {
  return normalizeBusinessType(value) === "general_business";
}
