import type { ProfileButtonType } from "@/lib/profile-buttons";

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

export type BusinessPrimaryLinkDefaults = {
  primary_link_1_title: string;
  primary_link_1_url: string;
  primary_link_1_type: ProfileButtonType;
  primary_link_2_title: string;
  primary_link_2_url: string;
  primary_link_2_type: ProfileButtonType;
  primary_link_3_title: string;
  primary_link_3_url: string;
  primary_link_3_type: ProfileButtonType;
  primary_link_4_title: string;
  primary_link_4_url: string;
  primary_link_4_type: ProfileButtonType;
};

export function getBusinessTypePrimaryLinkDefaults(value?: string | null): BusinessPrimaryLinkDefaults | null {
  if (isAutomotiveBusiness(value)) {
    return {
      primary_link_1_title: "View Inventory",
      primary_link_1_url: "",
      primary_link_1_type: "website",
      primary_link_2_title: "Get Pre-Approved",
      primary_link_2_url: "",
      primary_link_2_type: "website",
      primary_link_3_title: "Value My Trade",
      primary_link_3_url: "",
      primary_link_3_type: "website",
      primary_link_4_title: "Schedule Test Drive",
      primary_link_4_url: "",
      primary_link_4_type: "booking"
    };
  }

  if (isInsuranceBusiness(value)) {
    return {
      primary_link_1_title: "Request Quote",
      primary_link_1_url: "",
      primary_link_1_type: "website",
      primary_link_2_title: "Schedule Review",
      primary_link_2_url: "",
      primary_link_2_type: "booking",
      primary_link_3_title: "File a Claim",
      primary_link_3_url: "",
      primary_link_3_type: "website",
      primary_link_4_title: "Coverage Options",
      primary_link_4_url: "",
      primary_link_4_type: "website"
    };
  }

  if (isMortgageBusiness(value)) {
    return {
      primary_link_1_title: "Apply Now",
      primary_link_1_url: "",
      primary_link_1_type: "website",
      primary_link_2_title: "Get Pre-Qualified",
      primary_link_2_url: "",
      primary_link_2_type: "website",
      primary_link_3_title: "Mortgage Calculator",
      primary_link_3_url: "",
      primary_link_3_type: "website",
      primary_link_4_title: "Schedule Consultation",
      primary_link_4_url: "",
      primary_link_4_type: "booking"
    };
  }

  if (isRecruitingBusiness(value)) {
    return {
      primary_link_1_title: "Submit Resume",
      primary_link_1_url: "",
      primary_link_1_type: "website",
      primary_link_2_title: "Open Positions",
      primary_link_2_url: "",
      primary_link_2_type: "website",
      primary_link_3_title: "Hire Talent",
      primary_link_3_url: "",
      primary_link_3_type: "website",
      primary_link_4_title: "Schedule Interview",
      primary_link_4_url: "",
      primary_link_4_type: "booking"
    };
  }

  if (isFinancialAdvisorBusiness(value)) {
    return {
      primary_link_1_title: "Schedule Consultation",
      primary_link_1_url: "",
      primary_link_1_type: "booking",
      primary_link_2_title: "Retirement Planning",
      primary_link_2_url: "",
      primary_link_2_type: "website",
      primary_link_3_title: "Wealth Review",
      primary_link_3_url: "",
      primary_link_3_type: "website",
      primary_link_4_title: "Resources",
      primary_link_4_url: "",
      primary_link_4_type: "website"
    };
  }

  return null;
}

export function applyBusinessTypePrimaryLinkDefaults<T extends {
  primary_link_1_title?: string | null;
  primary_link_1_url?: string | null;
  primary_link_2_title?: string | null;
  primary_link_2_url?: string | null;
  primary_link_3_title?: string | null;
  primary_link_3_url?: string | null;
  primary_link_4_title?: string | null;
  primary_link_4_url?: string | null;
}>(record: T, businessType?: string | null) {
  const defaults = getBusinessTypePrimaryLinkDefaults(businessType);
  if (!defaults) return record;

  const hasAnyPrimaryLinkContent = [
    [record.primary_link_1_title, record.primary_link_1_url],
    [record.primary_link_2_title, record.primary_link_2_url],
    [record.primary_link_3_title, record.primary_link_3_url],
    [record.primary_link_4_title, record.primary_link_4_url]
  ].some(([title, url]) => !!(String(title || "").trim() || String(url || "").trim()));

  if (hasAnyPrimaryLinkContent) return record;

  return {
    ...record,
    ...defaults
  };
}
