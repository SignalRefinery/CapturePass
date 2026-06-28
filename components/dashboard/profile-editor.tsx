"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ProfileRecord, ProfileViewRecord } from "@/lib/types";
import { getProfilePlan } from "@/lib/plans";
import { normalizeUrl } from "@/lib/utils";
import { classifySlug } from "@/lib/slug-moderation";
import { isRealEstateBusiness } from "@/lib/business-types";
import {
  PROFILE_BUTTON_TYPE_DESCRIPTIONS,
  PROFILE_BUTTON_TYPE_LABELS,
  PROFILE_BUTTON_TYPE_PLACEHOLDERS,
  PROFILE_BUTTON_TYPES,
  getProfileButtonEditorValue,
  inferProfileButtonType,
  normalizeProfileButtonType
} from "@/lib/profile-buttons";
import { CUSTOM_THEME_KEY, PROFILE_THEME_OPTIONS, THEME_COLOR_ROLE_LABELS, coerceThemeForPlan, resolveThemeColors, themeIsAllowedForPlan } from "@/lib/themes";
import { resolveSecondaryActionMode } from "@/lib/profiles/secondary-action";
import { designTokens } from "@/lib/design-tokens";
import {
  deleteProfileViewClient,
  getProfileIdForUserClient,
  isSlugTakenClient,
  saveProfileClient,
  saveProfileViewClient,
  setDefaultProfileViewClient
} from "@/lib/profile-service-client";
import { getReadableProfileUrl, getIssuedProfileUrl } from "@/lib/urls/profile-url";

type ProfileEditorProps = {
  userId: string;
  initialProfile: ProfileRecord;
  initialProfileViews: ProfileViewRecord[];
  businessType?: ProfileRecord["business_type"];
};

const LINK_FIELD_CONFIG = [
  {
    typeKey: "primary_link_1_type" as const,
    titleKey: "primary_link_1_title" as const,
    urlKey: "primary_link_1_url" as const,
    titleLabel: "Button title",
    typeLabel: "Button type",
    urlLabel: "Button destination",
    titlePlaceholder: "Call",
    urlPlaceholder: "5551234567",
    titleHint: "What users see on the button.",
    urlHint: "Phone number, email, or link target."
  },
  {
    typeKey: "primary_link_2_type" as const,
    titleKey: "primary_link_2_title" as const,
    urlKey: "primary_link_2_url" as const,
    titleLabel: "Button title",
    typeLabel: "Button type",
    urlLabel: "Button destination",
    titlePlaceholder: "Email",
    urlPlaceholder: "you@example.com",
    titleHint: "What users see on the button.",
    urlHint: "Phone number, email, or link target."
  },
  {
    typeKey: "primary_link_3_type" as const,
    titleKey: "primary_link_3_title" as const,
    urlKey: "primary_link_3_url" as const,
    titleLabel: "Button title",
    typeLabel: "Button type",
    urlLabel: "Button destination",
    titlePlaceholder: "Website",
    urlPlaceholder: "https://your-link.com",
    titleHint: "What users see on the button.",
    urlHint: "Phone number, email, or link target."
  },
  {
    typeKey: "primary_link_4_type" as const,
    titleKey: "primary_link_4_title" as const,
    urlKey: "primary_link_4_url" as const,
    titleLabel: "Button title",
    typeLabel: "Button type",
    urlLabel: "Button destination",
    titlePlaceholder: "Custom link",
    urlPlaceholder: "https://your-link.com",
    titleHint: "What users see on the button.",
    urlHint: "Phone number, email, or link target."
  }
];

const MAX_INTRO_TEXTAREA_HEIGHT = 220;
const LEGACY_INTRO_PROMPT = "Turning complexity into clarity.";
const INTRO_PLACEHOLDER =
  "Write a short line in your own words: what you do, who you help, or the best next step.";
const BUSINESS_INDIVIDUAL_LOGO_MAX_BYTES = 5 * 1024 * 1024;

function UpgradeNotice({ children }: { children: React.ReactNode }) {
  return <small className="auth-message">{children}</small>;
}

function cleanIntroValue(value?: string | null) {
  return (value || "").trim() === LEGACY_INTRO_PROMPT ? "" : value || "";
}

function AutoResizeTextarea({
  value,
  onChange,
  placeholder
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_INTRO_TEXTAREA_HEIGHT)}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > MAX_INTRO_TEXTAREA_HEIGHT ? "auto" : "hidden";
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      className="intro-textarea"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={2}
    />
  );
}

function phoneToTel(value?: string | null) {
  const digits = (value || "").replace(/\D/g, "");
  if (!digits) return "";
  return `tel:${digits.length === 10 ? "1" : ""}${digits}`;
}

function emailToMailto(value?: string | null) {
  const email = (value || "").trim();
  if (!email) return "";
  return `mailto:${email}`;
}

function friendlySlugReviewReason(reason?: string | null) {
  if (!reason) return null;

  if (reason === "denied_by_admin") {
    return "This URL was not approved. Choose another one.";
  }

  if (reason === "approved_by_admin" || reason === "approved_by_admin_override") {
    return "Public URL approved.";
  }

  if (reason === "blocked_name_based_slug_fallback") {
    return "We generated a card QR link for added privacy.";
  }

  if (reason === "public_office_title") {
    return "This URL may reference a public office, campaign, or organization and requires review.";
  }

  return reason;
}

function friendlySlugRestrictionMessage(reason?: string | null) {
  if (!reason) return "This URL is restricted or unavailable.";

  return reason
    .replace(/^That slug/, "This URL")
    .replace(/^Slugs must/, "URLs must")
    .replace(/\bslug\b/g, "URL")
    .replace(/\bSlug\b/g, "URL");
}

function createViewFromProfile(
  profile: ProfileRecord,
  profileId: string,
  index: number,
  label: "Property" | "View" = "View"
): ProfileViewRecord {
  return {
    profile_id: profileId,
    name: `${label} ${index + 1}`,
    view_key: `view-${Date.now()}`,
    sort_order: index,
    full_name: profile.full_name || "",
    organization_name: profile.organization_name || "",
    role_line: profile.role_line || "",
    intro: cleanIntroValue(profile.intro),
    email: profile.email || "",
    phone: profile.phone || "",
    text_phone: profile.text_phone || "",
    website_url: "",
    profile_badge_1: profile.profile_badge_1 || "",
    profile_badge_2: profile.profile_badge_2 || "",
    profile_badge_3: profile.profile_badge_3 || "",
    show_email: true,
    show_phone: true,
    show_text: true,
    show_in_public_nav: true,
    primary_link_1_title: profile.primary_link_1_title || "Call",
    primary_link_1_url: profile.primary_link_1_url || phoneToTel(profile.phone),
    primary_link_1_type: normalizeProfileButtonType(
      profile.primary_link_1_type || inferProfileButtonType(profile.primary_link_1_url, profile.primary_link_1_title)
    ),
    primary_link_2_title: profile.primary_link_2_title || "Email",
    primary_link_2_url: profile.primary_link_2_url || emailToMailto(profile.email),
    primary_link_2_type: normalizeProfileButtonType(
      profile.primary_link_2_type || inferProfileButtonType(profile.primary_link_2_url, profile.primary_link_2_title)
    ),
    primary_link_3_title: "",
    primary_link_3_url: "",
    primary_link_3_type: "website",
    primary_link_4_title: "",
    primary_link_4_url: "",
    primary_link_4_type: "website"
  };
}

function normalizeViewForSave(view: ProfileViewRecord, fallbackName = "Profile view"): ProfileViewRecord {
  return {
    ...view,
    name: view.name.trim() || fallbackName,
    full_name: view.full_name.trim(),
    organization_name: (view.organization_name || "").trim(),
    role_line: view.role_line.trim(),
    intro: view.intro.trim(),
    email: view.email.trim(),
    phone: view.phone.trim(),
    text_phone: (view.text_phone || "").trim(),
    website_url: normalizeUrl(view.website_url || ""),
    profile_badge_1: (view.profile_badge_1 || "").trim(),
    profile_badge_2: (view.profile_badge_2 || "").trim(),
    profile_badge_3: (view.profile_badge_3 || "").trim(),
    primary_link_1_type: normalizeProfileButtonType(
      view.primary_link_1_type || inferProfileButtonType(view.primary_link_1_url, view.primary_link_1_title)
    ),
    primary_link_2_type: normalizeProfileButtonType(
      view.primary_link_2_type || inferProfileButtonType(view.primary_link_2_url, view.primary_link_2_title)
    ),
    primary_link_3_type: normalizeProfileButtonType(
      view.primary_link_3_type || inferProfileButtonType(view.primary_link_3_url, view.primary_link_3_title)
    ),
    primary_link_4_type: normalizeProfileButtonType(
      view.primary_link_4_type || inferProfileButtonType(view.primary_link_4_url, view.primary_link_4_title)
    ),
    updated_at: new Date().toISOString()
  };
}

export function ProfileEditor({
  userId,
  initialProfile,
  initialProfileViews,
  businessType
}: ProfileEditorProps) {
  const resolvedBusinessType =
    businessType && businessType !== "general_business" ? businessType : initialProfile.business_type;
  const isRealEstateBusinessProfile = isRealEstateBusiness(resolvedBusinessType);
  const [form, setForm] = useState<ProfileRecord>({
    ...initialProfile,
    intro: cleanIntroValue(initialProfile.intro),
    consent_public_visibility: initialProfile.consent_public_visibility !== false,
    text_phone: initialProfile.text_phone || "",
    theme_key: coerceThemeForPlan(initialProfile.theme_key, getProfilePlan(initialProfile)),
    secondary_action_mode: resolveSecondaryActionMode(initialProfile)
  });
  const [views, setViews] = useState<ProfileViewRecord[]>(
    initialProfileViews.map((view) => ({
      ...view,
      show_in_public_nav: view.show_in_public_nav !== false,
      intro: cleanIntroValue(view.intro)
    }))
  );
  const [activeViewKey, setActiveViewKey] = useState(
    initialProfile.default_view_id || initialProfileViews[0]?.id || initialProfileViews[0]?.view_key || ""
  );
  const [saving, setSaving] = useState(false);
  const [viewSaving, setViewSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [viewMessage, setViewMessage] = useState("");
  const [viewError, setViewError] = useState("");
  const [logoDeleting, setLogoDeleting] = useState(false);
  const [slugInput, setSlugInput] = useState(initialProfile.slug_requested || initialProfile.slug || "");
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugTaken, setSlugTaken] = useState(false);
  const [slugCheckError, setSlugCheckError] = useState("");
  const slugCheckRequestRef = useRef(0);
  const profileLogoInputRef = useRef<HTMLInputElement | null>(null);
  const plan = getProfilePlan(form);
  const canManageBusinessIndividualLogo = plan.key === "business_individual";
  const secondaryActionMode = resolveSecondaryActionMode(form);
  const selectedThemeKey = coerceThemeForPlan(form.theme_key, plan);
  const showCustomThemeColors = selectedThemeKey === CUSTOM_THEME_KEY;
  const customThemeColors = resolveThemeColors({
    themeKey: CUSTOM_THEME_KEY,
    customPrimary: form.brand_color_primary,
    customSecondary: form.brand_color_secondary,
    customAccent: form.brand_color_accent,
    customBackground: form.brand_color_background,
    customText: form.brand_color_text
  });

  const slugModeration = useMemo(() => classifySlug(slugInput || ""), [slugInput]);
  const activeSlugModeration = useMemo(() => classifySlug(form.slug || ""), [form.slug]);
  const normalizedSlugInput = slugModeration.normalized;
  const slugMatchesActive = normalizedSlugInput === (form.slug || "");
  const slugMatchesPending = normalizedSlugInput === (form.slug_requested || "");
  const slugHasChanged = !!normalizedSlugInput && !slugMatchesActive;
  const slugIsApproved = form.slug_status === "approved" && activeSlugModeration.state !== "blocked";
  const readableUrl = useMemo(() => getReadableProfileUrl(form), [form]);
  const cardUrl = useMemo(() => getIssuedProfileUrl(form), [form]);
  const safeReadableUrl = slugIsApproved && plan.isActivated ? readableUrl : null;
  const safeCardUrl = form.private_token && plan.isActivated ? cardUrl : null;
  const profileStatusLabel = slugIsApproved
    ? form.private_token
      ? "Ready to share"
      : "Pending card"
    : form.slug_status === "pending_review"
      ? "Pending slug approval"
      : activeSlugModeration.state === "blocked"
        ? "Slug blocked"
        : "Not ready";

  const slugStatusLabel =
    slugModeration.state === "blocked"
      ? "Restricted"
      : slugChecking
        ? "Checking"
        : slugTaken
          ? "Unavailable"
          : form.slug_status === "rejected" && !slugHasChanged
            ? "Rejected"
              : form.slug_status === "pending_review" && slugMatchesPending
                ? "Pending"
              : slugModeration.state === "review"
                ? "Review needed"
                : slugHasChanged
                  ? "Available"
                  : slugIsApproved
                    ? "Approved"
                    : "Not ready";

  const slugStatusMessage =
    slugModeration.state === "blocked"
      ? friendlySlugRestrictionMessage(slugModeration.reason)
      : slugChecking
        ? "Checking availability."
        : slugCheckError
          ? slugCheckError
          : slugTaken
            ? "This URL is already in use."
            : form.slug_status === "rejected" && !slugHasChanged
              ? friendlySlugReviewReason(form.slug_review_reason) ||
                "This URL was not approved. Choose another one."
              : form.slug_status === "pending_review" && slugMatchesPending
                ? "This URL is pending review before it goes live."
                : slugModeration.state === "review"
                  ? "This URL may reference a public office, campaign, or organization and requires review."
                  : slugHasChanged
                    ? "This URL looks available."
                    : slugIsApproved
                      ? "Public URL approved."
                      : "";
  const showSlugStatus =
    slugChecking ||
    !!slugCheckError ||
    slugModeration.state === "blocked" ||
    slugTaken ||
    (form.slug_status === "rejected" && !slugHasChanged) ||
    (form.slug_status === "pending_review" && slugMatchesPending) ||
    slugModeration.state === "review" ||
    slugHasChanged ||
    (!!slugStatusMessage && !slugIsApproved);
  const showCurrentUrlReviewNote =
    (form.slug_status === "pending_review" && !!form.slug_requested) ||
    (slugModeration.state === "review" && slugHasChanged);
  const activeView =
    views.find((view) => (view.id || view.view_key) === activeViewKey) || views[0] || null;
  const defaultViewId = form.default_view_id || views[0]?.id || null;
  const canUseMultiViewProfile = isRealEstateBusinessProfile && plan.hasMoreProfileSections;
  const profileSectionLabel = isRealEstateBusinessProfile ? "Property" : "View";
  const profileSectionPlural = isRealEstateBusinessProfile ? "Properties" : "Profile views";
  const profileSectionLower = isRealEstateBusinessProfile ? "property" : "view";
  const maxProfileViews = canUseMultiViewProfile ? 5 : 0;
  const isMultiViewMode = canUseMultiViewProfile && (form.page_mode || "single") === "multi";

  useEffect(() => {
    setSlugTaken(false);
    setSlugCheckError("");

    if (!normalizedSlugInput || slugModeration.state === "blocked" || slugMatchesActive || slugMatchesPending) {
      setSlugChecking(false);
      return;
    }

    const requestId = slugCheckRequestRef.current + 1;
    slugCheckRequestRef.current = requestId;
    setSlugChecking(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const taken = await isSlugTakenClient(normalizedSlugInput, userId);

        if (slugCheckRequestRef.current !== requestId) return;
        setSlugTaken(taken);
      } catch {
        if (slugCheckRequestRef.current !== requestId) return;
        setSlugCheckError("Unable to check slug availability right now. Try saving again in a moment.");
      } finally {
        if (slugCheckRequestRef.current === requestId) {
          setSlugChecking(false);
        }
      }
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [normalizedSlugInput, slugMatchesActive, slugMatchesPending, slugModeration.state, userId]);

  function update<K extends keyof ProfileRecord>(key: K, value: ProfileRecord[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateMultiViewDisplayMode(value: ProfileRecord["multi_view_display_mode"]) {
    if (!canUseMultiViewProfile) return;

    setForm((current) => ({
      ...current,
      page_mode: "multi",
      multi_view_display_mode: value
    }));
  }

  function updateView<K extends keyof ProfileViewRecord>(key: K, value: ProfileViewRecord[K]) {
    if (!activeView) return;

    setViews((current) =>
      current.map((view) =>
        (view.id || view.view_key) === (activeView.id || activeView.view_key)
          ? { ...view, [key]: value }
          : view
      )
    );
  }

  async function copyPublicProfileUrl() {
    try {
      if (!safeReadableUrl) {
        throw new Error("Public profile link is not available yet.");
      }
      await navigator.clipboard.writeText(safeReadableUrl);
      setMessage("Public profile link copied.");
      setError("");
    } catch {
      setError("Unable to copy the public profile link.");
      setMessage("");
    }
  }

  async function copyCardUrl() {
    try {
      if (!safeCardUrl) {
        throw new Error("Card URL is not available yet.");
      }
      await navigator.clipboard.writeText(safeCardUrl);
      setMessage("Card URL copied.");
      setError("");
    } catch {
      setError("Unable to copy the card URL.");
      setMessage("");
    }
  }

  async function saveActiveViewChanges() {
    if (!activeView) return null;

    const result = await saveProfileViewClient(
      normalizeViewForSave(activeView, isRealEstateBusinessProfile ? "Property" : "Profile view")
    );

    if (result.error) {
      throw new Error(
        result.error.message || (isRealEstateBusinessProfile ? "Failed to save property." : "Failed to save view.")
      );
    }

    const savedView = result.data as ProfileViewRecord;
    setViews((current) =>
      current.map((view) =>
        (view.id || view.view_key) === (activeView.id || activeView.view_key)
          ? savedView
          : view
      )
    );
    setActiveViewKey(savedView.id || savedView.view_key);

    return savedView;
  }

  async function uploadBusinessIndividualLogo(file: File) {
    const logoFormData = new FormData();
    logoFormData.set("logo", file);

    const response = await fetch("/api/profile-logo", {
      method: "POST",
      body: logoFormData
    });
    const result = (await response.json().catch(() => ({}))) as {
      brand_logo_url?: string | null;
      error?: string;
    };

    if (!response.ok) {
      throw new Error(result.error || "Logo upload failed.");
    }

    return result.brand_logo_url || null;
  }

  async function handleDeleteBusinessIndividualLogo() {
    if (logoDeleting) return;

    setLogoDeleting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/profile-logo", {
        method: "DELETE"
      });
      const result = (await response.json().catch(() => ({}))) as {
        brand_logo_url?: string | null;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || "Unable to remove logo.");
      }

      setForm((current) => ({ ...current, brand_logo_url: null }));
      if (profileLogoInputRef.current) {
        profileLogoInputRef.current.value = "";
      }
      setMessage("Logo removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove logo.");
    } finally {
      setLogoDeleting(false);
    }
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving || viewSaving) return;

    setSaving(true);
    setViewSaving(isMultiViewMode && !!activeView);
    setError("");
    setMessage("");
    setViewError("");
    setViewMessage("");

    try {
      const logoFile = profileLogoInputRef.current?.files?.[0] || null;

      if (logoFile && !canManageBusinessIndividualLogo) {
        throw new Error("Logo upload is available for Business Individual profiles.");
      }

      if (logoFile && logoFile.type !== "image/png") {
        throw new Error("Business Individual logos must be PNG files.");
      }

      if (logoFile && logoFile.size > BUSINESS_INDIVIDUAL_LOGO_MAX_BYTES) {
        throw new Error("Business Individual logos must be 5 MB or smaller.");
      }

      if (slugModeration.state === "blocked") {
        throw new Error(slugModeration.reason || "This slug is restricted or unavailable.");
      }

      if (slugChecking) {
        throw new Error("Slug availability is still being checked. Try again in a moment.");
      }

      if (slugTaken) {
        throw new Error("This slug is restricted or unavailable. Choose another slug.");
      }

      const payload: ProfileRecord = {
        ...form,
        slug: normalizedSlugInput || form.slug,
        organization_name: (form.organization_name || "").trim(),
        page_mode: canUseMultiViewProfile ? form.page_mode || "single" : "single",
        multi_view_display_mode: canUseMultiViewProfile ? form.multi_view_display_mode || "favorite" : "favorite",
        website_url: normalizeUrl(form.website_url || ""),
        profile_badge_1: (form.profile_badge_1 || "").trim(),
        profile_badge_2: (form.profile_badge_2 || "").trim(),
        profile_badge_3: (form.profile_badge_3 || "").trim(),
        updated_at: new Date().toISOString()
      };

      const result = await saveProfileClient(payload, userId);

      if (!result) {
        throw new Error("No response from save.");
      }

      if (result.error) {
        throw new Error(result.error.message || "Failed to save profile.");
      }

      let savedProfile = result.data as ProfileRecord | null;

      if (logoFile) {
        const brandLogoUrl = await uploadBusinessIndividualLogo(logoFile);
        savedProfile = {
          ...(savedProfile || payload),
          brand_logo_url: brandLogoUrl
        };
        if (profileLogoInputRef.current) {
          profileLogoInputRef.current.value = "";
        }
      }

      if (savedProfile) {
        setForm(savedProfile);
        setSlugInput(savedProfile.slug_requested || savedProfile.slug || "");
      }

      const savedSlugStatus = (result.data as ProfileRecord | null)?.slug_status;
      const savedRequestedSlug = (result.data as ProfileRecord | null)?.slug_requested;

      if (isMultiViewMode) {
        try {
          await saveActiveViewChanges();
        } catch (viewErr) {
          console.error("Profile view save failed:", viewErr);
          setViewError(
            viewErr instanceof Error
              ? isRealEstateBusinessProfile
                ? `Profile saved, but the active property was not saved: ${viewErr.message}`
                : `Profile saved, but the active view was not saved: ${viewErr.message}`
              : isRealEstateBusinessProfile
                ? "Profile saved, but the active property was not saved."
                : "Profile saved, but the active view was not saved."
          );
          setMessage(
            isRealEstateBusinessProfile
              ? "Profile saved. The active property still needs attention."
              : "Profile saved. The active view still needs attention."
          );
          return;
        }
      }

      setMessage(
        savedSlugStatus === "pending_review"
          ? `Changes saved. ${savedRequestedSlug ? `/${savedRequestedSlug}` : "Your requested URL"} is pending review.`
          : logoFile
            ? "Changes saved. Logo updated."
            : "Changes saved."
      );
    } catch (err) {
      console.error("Profile save failed:", err);
      setError(err instanceof Error ? err.message : "Error saving profile.");
    } finally {
      setSaving(false);
      setViewSaving(false);
    }
  }

  async function handleCreateView() {
    if (viewSaving || views.length >= maxProfileViews || !canUseMultiViewProfile) return;

    setViewSaving(true);
    setViewError("");
    setViewMessage("");

    try {
      let profileId = form.id || null;

      if (!profileId) {
        const profileResult = await getProfileIdForUserClient(userId);

        if (profileResult.error) {
          throw new Error(profileResult.error.message || "Unable to find your profile.");
        }

        profileId = profileResult.data?.id || null;
      }

      if (!profileId) {
        throw new Error(
          isRealEstateBusinessProfile
            ? "Save your profile once before creating properties."
            : "Save your profile once before creating profile views."
        );
      }

      const draft = createViewFromProfile(
        form,
        profileId,
        views.length,
        isRealEstateBusinessProfile ? "Property" : "View"
      );
      const result = await saveProfileViewClient(draft);

      if (result.error) {
        throw new Error(
          result.error.message ||
            (isRealEstateBusinessProfile ? "Failed to create property." : "Failed to create profile view.")
        );
      }

      const savedView = result.data as ProfileViewRecord;
      setViews((current) => [...current, savedView]);
      setActiveViewKey(savedView.id || savedView.view_key);

      if (!form.default_view_id && savedView.id) {
        const defaultResult = await setDefaultProfileViewClient(userId, savedView.id);

        if (!defaultResult.error && defaultResult.data) {
          const savedProfile = defaultResult.data as ProfileRecord;
          setForm((current) => ({
            ...savedProfile,
            page_mode: current.page_mode,
            multi_view_display_mode: current.multi_view_display_mode,
            default_view_id: savedProfile.default_view_id
          }));
        }
      }

      setViewMessage(isRealEstateBusinessProfile ? "Property created." : "Profile view created.");
    } catch (err) {
      setViewError(
        err instanceof Error
          ? err.message
          : isRealEstateBusinessProfile
            ? "Unexpected error while creating the property."
            : "Unexpected error while creating the view."
      );
    } finally {
      setViewSaving(false);
    }
  }

  async function handleSetDefaultView(view: ProfileViewRecord) {
    if (!view.id || viewSaving) return;

    setViewSaving(true);
    setViewError("");
    setViewMessage("");

    try {
      const result = await setDefaultProfileViewClient(userId, view.id);

      if (result.error) {
        throw new Error(
          result.error.message ||
            (isRealEstateBusinessProfile ? "Failed to set featured property." : "Failed to set default profile view.")
        );
      }

      if (result.data) {
        const savedProfile = result.data as ProfileRecord;
        setForm((current) => ({
          ...savedProfile,
          page_mode: current.page_mode,
          multi_view_display_mode: current.multi_view_display_mode,
          default_view_id: savedProfile.default_view_id
        }));
      } else {
        update("default_view_id", view.id);
      }

      setActiveViewKey(view.id);
      setViewMessage(isRealEstateBusinessProfile ? "Default property updated." : "Default profile view updated.");
    } catch (err) {
      setViewError(
        err instanceof Error
          ? err.message
          : isRealEstateBusinessProfile
            ? "Unexpected error while setting the featured property."
            : "Unexpected error while setting the default view."
      );
    } finally {
      setViewSaving(false);
    }
  }

  async function handleDeleteView(view: ProfileViewRecord) {
    if (!view.id || view.id === defaultViewId || viewSaving) return;

    const confirmed = window.confirm(isRealEstateBusinessProfile ? "Delete this property?" : "Delete this profile view?");
    if (!confirmed) return;

    setViewSaving(true);
    setViewError("");
    setViewMessage("");

    try {
      const result = await deleteProfileViewClient(view.id);

      if (result.error) {
        throw new Error(
          result.error.message ||
            (isRealEstateBusinessProfile ? "Failed to delete property." : "Failed to delete profile view.")
        );
      }

      const remainingViews = views.filter((current) => current.id !== view.id);
      setViews(remainingViews);
      setActiveViewKey(remainingViews[0]?.id || remainingViews[0]?.view_key || "");
      setViewMessage(isRealEstateBusinessProfile ? "Property deleted." : "Profile view deleted.");
    } catch (err) {
      setViewError(
        err instanceof Error
          ? err.message
          : isRealEstateBusinessProfile
            ? "Unexpected error while deleting the property."
            : "Unexpected error while deleting the view."
      );
    } finally {
      setViewSaving(false);
    }
  }

  return (
    <section className="dashboard-wrap">
      <div className="card" style={{ padding: 26 }}>
        <div className="dashboard-kicker">Profile</div>
        <h2
          style={{
            margin: "6px 0 10px",
            fontFamily: "var(--font-heading)",
            fontSize: 42,
            lineHeight: 0.98,
            letterSpacing: "-0.035em",
            fontWeight: 800
          }}
        >
          Edit your CapturePass profile.
        </h2>

        <p className="editor-copy">
          {plan.isActivated
            ? "Shape how people encounter you. Keep the next step clear, make follow-up easier, and present yourself with less clutter."
            : "Your reserved profile is preview-only. Save the basics now, then activate Business Individual or a business plan when you are ready to go public."}
        </p>
        <p className="auth-message" style={{ marginTop: 10 }}>
          Current plan:{" "}
          <strong>{plan.isActivated ? (plan.key === "business_individual" ? "Business Individual" : "Business plan") : "Reserved profile"}</strong>
        </p>

        <form className="editor-form" onSubmit={handleSave} style={{ marginTop: 24 }}>
          <div className="editor-actions" style={{ marginBottom: 22 }}>
            <button className="button primary" type="submit" disabled={saving || viewSaving}>
              {saving || viewSaving ? "Saving..." : "Save changes"}
            </button>
            <a className="button secondary" href="/dashboard/preview" target="_blank" rel="noreferrer">
              Preview profile
            </a>
          </div>

          <div className="editor-grid">
            <label className="auth-field">
              <span>Full name</span>
              <input
                value={form.full_name || ""}
                onChange={(event) => update("full_name", event.target.value)}
                placeholder="Full name"
              />
            </label>

            <div className="auth-field">
              <span>Current public URL</span>
              <input value={`capturepass.com/${form.slug || ""}`} readOnly disabled />
              {showCurrentUrlReviewNote ? (
                <small className="auth-message">
                  Your current public URL remains active until approval.
                </small>
              ) : null}
            </div>

            <div className="auth-field">
              <span>Requested slug</span>
              <input
                value={slugInput}
                onChange={(event) => setSlugInput(event.target.value)}
                placeholder="your-name"
                aria-invalid={slugModeration.state === "blocked" || slugTaken}
              />
              {showSlugStatus ? (
                <small
                  className={
                    slugModeration.state === "blocked" ||
                    slugTaken ||
                    (form.slug_status === "rejected" && !slugHasChanged)
                      ? "auth-error slug-status-helper"
                      : "auth-message slug-status-helper"
                  }
                >
                  {slugStatusLabel}
                  {slugStatusMessage ? `: ${slugStatusMessage}` : ""}
                </small>
              ) : null}
              {normalizedSlugInput && normalizedSlugInput !== slugInput ? (
                <small className="auth-message">
                  It will be saved as <strong>{normalizedSlugInput}</strong>.
                </small>
              ) : null}
            </div>
          </div>

          {canManageBusinessIndividualLogo ? (
            <div className="card" style={{ marginTop: 18, padding: 18 }}>
              <div className="dashboard-kicker">Business logo</div>
              <h3 style={{ margin: "6px 0 8px" }}>Show your brand first.</h3>
              <p className="editor-copy">
                Upload a PNG logo to replace the initials/avatar block on your public profile with a wide brand mark.
              </p>
              <label className="editor-label" style={{ marginTop: 18 }}>
                Logo PNG
                {form.brand_logo_url ? (
                  <div className="business-logo-preview">
                    {/* eslint-disable-next-line @next/next/no-img-element -- storage-backed customer logos are remote runtime uploads. */}
                    <img src={form.brand_logo_url} alt={`${form.organization_name || form.full_name || "Business"} logo`} />
                    <span className="table-subtext">Current logo</span>
                  </div>
                ) : (
                  <span className="table-subtext">No logo uploaded.</span>
                )}
                <input
                  className="editor-input"
                  ref={profileLogoInputRef}
                  type="file"
                  accept="image/png"
                  disabled={saving || viewSaving || logoDeleting}
                />
                <span className="table-subtext">PNG only. Max 5 MB. Save changes to upload a selected logo.</span>
              </label>
              {form.brand_logo_url ? (
                <button
                  className="button secondary"
                  type="button"
                  disabled={saving || viewSaving || logoDeleting}
                  onClick={handleDeleteBusinessIndividualLogo}
                  style={{ marginTop: 12 }}
                >
                  {logoDeleting ? "Removing..." : "Remove logo"}
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="editor-grid" style={{ marginTop: 18 }}>
            <label className="auth-field">
              <span>Organization or business name</span>
              <input
                value={form.organization_name || ""}
                onChange={(event) => update("organization_name", event.target.value)}
                placeholder="Optional"
              />
              <small className="auth-message">
                Included in your contact card when someone adds you to contacts.
              </small>
            </label>

            <label className="auth-field">
                <span>Role/Title</span>
                <input
                  value={form.role_line || ""}
                  onChange={(event) => update("role_line", event.target.value)}
                  placeholder="Advisor, Stylist, Founder"
                />
              </label>

            <label className="auth-field">
              <span>Website URL</span>
              <input
                value={form.website_url || ""}
                onChange={(event) => update("website_url", event.target.value)}
                placeholder="https://example.com"
              />
            </label>
          </div>

          <label className="auth-field" style={{ marginTop: 18 }}>
            <span>Intro</span>
            <AutoResizeTextarea
              value={form.intro || ""}
              onChange={(value) => update("intro", value)}
              placeholder={INTRO_PLACEHOLDER}
            />
          </label>

          <div className="card view-subsection" style={{ marginTop: 18 }}>
            <div className="dashboard-kicker">Profile badges</div>
            <div className="editor-grid" style={{ marginTop: 14 }}>
              <label className="auth-field">
                <span>Badge 1</span>
                <input
                  value={form.profile_badge_1 || ""}
                  onChange={(event) => update("profile_badge_1", event.target.value)}
                  placeholder="Direct profile"
                  disabled={!plan.hasAdvancedCustomization}
                />
              </label>

              <label className="auth-field">
                <span>Badge 2</span>
                <input
                  value={form.profile_badge_2 || ""}
                  onChange={(event) => update("profile_badge_2", event.target.value)}
                  placeholder="Direct follow-up"
                  disabled={!plan.hasAdvancedCustomization}
                />
              </label>

              <label className="auth-field">
                <span>Badge 3</span>
                <input
                  value={form.profile_badge_3 || ""}
                  onChange={(event) => update("profile_badge_3", event.target.value)}
                  placeholder="Verified contact card"
                  disabled={!plan.hasAdvancedCustomization}
                />
              </label>
            </div>
            {!plan.hasAdvancedCustomization ? (
              <UpgradeNotice>Advanced profile badges unlock with Business Individual and business plans.</UpgradeNotice>
            ) : null}
          </div>

          <div className="editor-grid" style={{ marginTop: 18 }}>
            <label className="auth-field">
              <span>Email</span>
              <input
                value={form.email || ""}
                onChange={(event) => update("email", event.target.value)}
                placeholder="you@example.com"
              />
            </label>

            <label className="auth-field">
              <span>Phone *</span>
              <input
                required
                type="tel"
                value={form.phone || ""}
                onChange={(event) => update("phone", event.target.value)}
                placeholder="5551234567"
              />
              {!form.phone ? (
                <small className="auth-error">
                  Phone is required for the Call and Text actions.
                </small>
              ) : (
                <small className="auth-message">
                  Used to automatically generate your Call and Text actions.
                </small>
              )}
            </label>

            <label className="auth-field">
              <span>Text phone</span>
              <input
                type="tel"
                value={form.text_phone || ""}
                onChange={(event) => update("text_phone", event.target.value)}
                placeholder="5551234567"
              />
              <small className="auth-message">
                Optional separate number for text-based contact actions and contact downloads.
              </small>
            </label>
          </div>

          <div className="action-choice-row" style={{ marginTop: 18 }}>
            <label className="auth-field" style={{ width: "100%" }}>
              <span>Secondary action</span>
              <select
                value={secondaryActionMode}
                onChange={(event) => update("secondary_action_mode", event.target.value as ProfileRecord["secondary_action_mode"])}
                style={{ width: "100%", padding: 10, marginTop: 8 }}
              >
                <option value="call">Call</option>
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="none">None</option>
              </select>
            </label>
            <small className="auth-message">
              Choose whether the hero button next to Add to Contacts opens a call, text, email, or stays hidden.
            </small>
          </div>

          <div className="card" style={{ marginTop: 24, padding: 22 }}>
            <div className="dashboard-kicker">CTA buttons</div>
            <h3 style={{ margin: "6px 0 10px", fontSize: "1.25rem", lineHeight: 1.1 }}>
              Put your most useful next steps first.
            </h3>
            <p className="editor-copy" style={{ marginBottom: 18 }}>
              These are the core actions people should see first. On your public profile, only
              completed buttons should appear.
            </p>

            {LINK_FIELD_CONFIG.map((field, index) => (
              <div
                className="editor-grid"
                style={{ marginTop: index === 0 ? 0 : 14 }}
                key={field.titleKey}
              >
                <label className="auth-field">
                  <span>{field.titleLabel}</span>
                  <input
                    value={(form[field.titleKey] as string) || ""}
                    onChange={(event) => update(field.titleKey, event.target.value)}
                    placeholder={field.titlePlaceholder}
                    disabled={!plan.hasExpandedLinks && index > 1}
                  />
                  <small className="auth-message">{field.titleHint}</small>
                </label>

                <label className="auth-field">
                  <span>{field.typeLabel}</span>
                  <select
                    value={normalizeProfileButtonType(
                      (form[field.typeKey] as string) ||
                        inferProfileButtonType(form[field.urlKey] as string, form[field.titleKey] as string)
                    )}
                    onChange={(event) => update(field.typeKey, event.target.value as ProfileRecord[typeof field.typeKey])}
                    disabled={!plan.hasExpandedLinks && index > 1}
                  >
                    {PROFILE_BUTTON_TYPES.map((buttonType) => (
                      <option key={buttonType} value={buttonType}>
                        {PROFILE_BUTTON_TYPE_LABELS[buttonType]}
                      </option>
                    ))}
                  </select>
                  <small className="auth-message">
                    {PROFILE_BUTTON_TYPE_DESCRIPTIONS[
                      normalizeProfileButtonType(
                        (form[field.typeKey] as string) ||
                          inferProfileButtonType(form[field.urlKey] as string, form[field.titleKey] as string)
                      )
                    ]}
                  </small>
                </label>

                <label className="auth-field">
                  <span>{field.urlLabel}</span>
                  <input
                    value={
                      getProfileButtonEditorValue(
                        (form[field.typeKey] as string) ||
                          inferProfileButtonType(form[field.urlKey] as string, form[field.titleKey] as string),
                        (form[field.urlKey] as string) || ""
                      )
                    }
                    onChange={(event) => update(field.urlKey, event.target.value)}
                    placeholder={PROFILE_BUTTON_TYPE_PLACEHOLDERS[
                      normalizeProfileButtonType(
                        (form[field.typeKey] as string) ||
                          inferProfileButtonType(form[field.urlKey] as string, form[field.titleKey] as string)
                      )
                    ]}
                    disabled={!plan.hasExpandedLinks && index > 1}
                  />
                  <small className="auth-message">{field.urlHint}</small>
                </label>
              </div>
            ))}
            {!plan.hasExpandedLinks ? (
              <UpgradeNotice>Business Individual and business plans include expanded CTA buttons.</UpgradeNotice>
            ) : null}
          </div>

          {canUseMultiViewProfile ? (
            <div className="card" style={{ marginTop: 24, padding: 22 }}>
            <div className="dashboard-kicker">{profileSectionPlural}</div>
            <h3 style={{ margin: "6px 0 10px", fontSize: "1.25rem", lineHeight: 1.1 }}>
              {isRealEstateBusinessProfile
                ? "Configure property pages."
                : "Configure single or multi-view display."}
            </h3>
            <p className="editor-copy" style={{ marginBottom: 18 }}>
              {isRealEstateBusinessProfile
                ? "Use one main property page, or let visitors switch between up to five configured properties."
                : "Single mode keeps your current profile behavior. Multi mode lets visitors switch between up to three configured views."}
            </p>

            <div className="editor-grid">
              <label className="auth-field">
                <span>{isRealEstateBusinessProfile ? "Property page setup" : "Page mode"}</span>
                <select
                  value={form.page_mode || "single"}
                  onChange={(event) =>
                    update("page_mode", event.target.value as ProfileRecord["page_mode"])
                  }
                  disabled={!plan.hasMoreProfileSections}
                >
                  <option value="single">
                    {isRealEstateBusinessProfile ? "Main property only" : "single"}
                  </option>
                  <option value="multi">
                    {isRealEstateBusinessProfile ? "Property collection" : "multi"}
                  </option>
                </select>
                {!plan.hasMoreProfileSections ? (
                  <UpgradeNotice>More profile sections and multi-view profiles unlock with Business Individual and business plans.</UpgradeNotice>
                ) : null}
              </label>

              {isMultiViewMode ? (
                <label className="auth-field">
                  <span>{isRealEstateBusinessProfile ? "Property navigation" : "Multi-view display"}</span>
                  <select
                    value={form.multi_view_display_mode || "favorite"}
                    onChange={(event) =>
                      updateMultiViewDisplayMode(
                        event.target.value as ProfileRecord["multi_view_display_mode"]
                      )
                    }
                  >
                    <option value="favorite">
                      {isRealEstateBusinessProfile ? "Feature default property" : "favorite"}
                    </option>
                    <option value="landing">
                      {isRealEstateBusinessProfile ? "Show property landing page" : "landing"}
                    </option>
                  </select>
                </label>
              ) : null}
            </div>

            {isMultiViewMode ? (
              <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
              <div className="status-list">
                {views.length > 0 ? (
                  views.map((view) => {
                    const viewKey = view.id || view.view_key;
                    const isActive = viewKey === activeViewKey;
                    const isDefault = !!view.id && view.id === defaultViewId;

                    return (
                      <div className="status-row" key={viewKey}>
                        <span>
                          <strong>{view.name || profileSectionLabel}</strong>
                          <br />
                          <small style={{ opacity: 0.72 }}>
                            {isDefault
                              ? isRealEstateBusinessProfile
                                ? "Featured property"
                                : "Default / favorite"
                              : isRealEstateBusinessProfile
                                ? "Property page"
                                : view.view_key}
                          </small>
                        </span>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <button
                            className={isActive ? "button primary" : "button secondary"}
                            type="button"
                            onClick={() => setActiveViewKey(viewKey)}
                          >
                            {isActive
                              ? `Editing ${profileSectionLower}`
                              : `Edit ${profileSectionLower}`}
                          </button>

                          {isMultiViewMode ? (
                            <button
                              className="button secondary"
                              type="button"
                              disabled={!view.id || isDefault || viewSaving}
                              onClick={() => handleSetDefaultView(view)}
                            >
                              {isDefault
                                ? isRealEstateBusinessProfile
                                  ? "Default property"
                                  : "Default"
                                : isRealEstateBusinessProfile
                                  ? "Set default property"
                                  : "Set default"}
                            </button>
                          ) : null}

                          <button
                            className="button secondary"
                            type="button"
                            disabled={!view.id || isDefault || viewSaving}
                            onClick={() => handleDeleteView(view)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="status-row">
                    <span>
                      {isRealEstateBusinessProfile
                        ? "No properties created yet. Single profile active."
                        : "No profile views created yet. Single profile active."}
                    </span>
                  </div>
                )}
              </div>

              {viewError ? <p className="auth-error">{viewError}</p> : null}
              {viewMessage ? <p className="auth-message">{viewMessage}</p> : null}

              <div className="editor-actions">
                <button
                  className="button secondary"
                  type="button"
                  disabled={viewSaving || views.length >= maxProfileViews}
                  onClick={handleCreateView}
                >
                  {views.length >= maxProfileViews
                    ? `${profileSectionLabel} limit reached`
                    : isRealEstateBusinessProfile
                      ? "Add Property"
                      : "Create profile view"}
                </button>
              </div>
            </div>
          ) : null}

            {isMultiViewMode && activeView ? (
              <div className="card" style={{ marginTop: 20, padding: 18 }}>
                <div className="dashboard-kicker">
                  {isRealEstateBusinessProfile ? "Editing property" : "Editing view"}
                </div>

                <div className="editor-grid" style={{ marginTop: 14 }}>
                  <label className="auth-field">
                    <span>{isRealEstateBusinessProfile ? "Property Name" : "View name"}</span>
                    <input
                      value={activeView.name || ""}
                      onChange={(event) => updateView("name", event.target.value)}
                      placeholder={isRealEstateBusinessProfile ? "Listing name" : "Campaign view"}
                    />
                  </label>

                  <label className="auth-field">
                    <span>Full name</span>
                    <input
                      value={activeView.full_name || ""}
                      onChange={(event) => updateView("full_name", event.target.value)}
                      placeholder="Full name"
                    />
                  </label>
                </div>

                <div className="editor-grid" style={{ marginTop: 14 }}>
                  <label className="auth-field">
                    <span>{isRealEstateBusinessProfile ? "Property Name" : "Organization or business name"}</span>
                    <input
                      value={activeView.organization_name || ""}
                      onChange={(event) => updateView("organization_name", event.target.value)}
                      placeholder="Optional"
                    />
                    <small className="auth-message">
                      {isRealEstateBusinessProfile
                        ? "Included in this property contact card."
                        : "Included in this view contact card."}
                    </small>
                  </label>

                  <label className="auth-field">
                    <span>{isRealEstateBusinessProfile ? "Property Summary" : "Role/Title"}</span>
                    <input
                      value={activeView.role_line || ""}
                      onChange={(event) => updateView("role_line", event.target.value)}
                      placeholder="Advisor, Stylist, Founder"
                    />
                  </label>
                </div>

                <div className="editor-grid" style={{ marginTop: 14 }}>
                  <label className="auth-field">
                    <span>{isRealEstateBusinessProfile ? "Property URL" : "Website"}</span>
                    <input
                      value={activeView.website_url || ""}
                      onChange={(event) => updateView("website_url", event.target.value)}
                      placeholder={isRealEstateBusinessProfile ? "https://listing-page.com" : "https://your-site.com"}
                    />
                  </label>
                </div>

                <div className="editor-grid" style={{ marginTop: 14 }}>
                  <label className="auth-field">
                    <span>Text phone</span>
                    <input
                      type="tel"
                      value={activeView.text_phone || ""}
                      onChange={(event) => updateView("text_phone", event.target.value)}
                      placeholder="5551234567"
                    />
                    <small className="auth-message">
                      Optional separate number for text-based contact actions.
                    </small>
                  </label>
                </div>

                <label className="auth-field" style={{ marginTop: 14 }}>
                  <span>{isRealEstateBusinessProfile ? "Property Description" : "Intro"}</span>
                  <AutoResizeTextarea
                    value={activeView.intro || ""}
                    onChange={(value) => updateView("intro", value)}
                    placeholder={INTRO_PLACEHOLDER}
                  />
                </label>

                <div className="card view-subsection" style={{ marginTop: 18 }}>
                  <div className="dashboard-kicker">{isRealEstateBusinessProfile ? "Property badges" : "Profile badges"}</div>
                  <div className="editor-grid" style={{ marginTop: 14 }}>
                    <label className="auth-field">
                      <span>Badge 1</span>
                        <input
                          value={activeView.profile_badge_1 || ""}
                          onChange={(event) => updateView("profile_badge_1", event.target.value)}
                          placeholder="Direct profile"
                          disabled={!plan.hasAdvancedCustomization}
                        />
                    </label>

                    <label className="auth-field">
                      <span>Badge 2</span>
                        <input
                          value={activeView.profile_badge_2 || ""}
                          onChange={(event) => updateView("profile_badge_2", event.target.value)}
                          placeholder="Direct follow-up"
                          disabled={!plan.hasAdvancedCustomization}
                        />
                    </label>

                    <label className="auth-field">
                      <span>Badge 3</span>
                        <input
                          value={activeView.profile_badge_3 || ""}
                          onChange={(event) => updateView("profile_badge_3", event.target.value)}
                          placeholder="Verified contact card"
                          disabled={!plan.hasAdvancedCustomization}
                        />
                    </label>
                  </div>
                </div>

                <div className="editor-grid" style={{ marginTop: 14 }}>
                  <label className="auth-field">
                    <span>Email</span>
                    <input
                      value={activeView.email || ""}
                      onChange={(event) => updateView("email", event.target.value)}
                      placeholder="you@example.com"
                    />
                  </label>

                  <label className="auth-field">
                    <span>Phone</span>
                    <input
                      type="tel"
                      value={activeView.phone || ""}
                      onChange={(event) => updateView("phone", event.target.value)}
                      placeholder="5551234567"
                    />
                  </label>
                </div>

                <div className="card view-subsection" style={{ marginTop: 18 }}>
                  <div className="dashboard-kicker">Contact visibility</div>
                  <div className="visibility-list">
                    <label className="toggle-row" style={{ margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={!!activeView.show_email}
                        onChange={(event) => updateView("show_email", event.target.checked)}
                      />
                      <span>
                        {isRealEstateBusinessProfile
                          ? "Display email address on this property."
                          : "Display email address on this view."}
                      </span>
                    </label>

                    <label className="toggle-row" style={{ margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={!!activeView.show_phone}
                        onChange={(event) => updateView("show_phone", event.target.checked)}
                      />
                      <span>
                        {isRealEstateBusinessProfile
                          ? "Display phone number on this property."
                          : "Display phone number on this view."}
                      </span>
                    </label>

                    <label className="toggle-row" style={{ margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={activeView.show_in_public_nav !== false}
                        onChange={(event) => updateView("show_in_public_nav", event.target.checked)}
                      />
                      <span>
                        {isRealEstateBusinessProfile
                          ? "Show this property in the public property list."
                          : "Show this view as a public profile button."}
                        <br />
                        <small className="auth-message">
                          {isRealEstateBusinessProfile
                            ? "Turn this off for properties you only want opened by card tap, QR scan, or digital pass."
                            : "Turn this off for views you only want opened by card tap, QR scan, or digital pass."}
                        </small>
                      </span>
                    </label>

                    <div className="action-choice-row">
                      <span className="action-choice-label">Secondary button</span>
                      <div className="action-choice-options" aria-label="Secondary profile button">
                        <button
                          className={activeView.show_text === true ? "action-choice is-active" : "action-choice"}
                          type="button"
                          disabled={!plan.hasCustomButtons}
                          onClick={() => updateView("show_text", true)}
                        >
                          Text
                        </button>

                        <button
                          className={activeView.show_text === false ? "action-choice is-active" : "action-choice"}
                          type="button"
                          disabled={!plan.hasCustomButtons}
                          onClick={() => updateView("show_text", false)}
                        >
                          Email
                        </button>

                        <button
                          className={activeView.show_text === null ? "action-choice is-active" : "action-choice"}
                          type="button"
                          disabled={!plan.hasCustomButtons}
                          onClick={() => updateView("show_text", null)}
                        >
                          None
                        </button>
                      </div>
                      {!plan.hasCustomButtons ? (
                        <UpgradeNotice>Custom profile buttons unlock with Business Individual and business plans.</UpgradeNotice>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="card view-subsection link-fields-card" style={{ marginTop: 18 }}>
                  <div className="dashboard-kicker">{isRealEstateBusinessProfile ? "Property CTA buttons" : "View CTA buttons"}</div>
                  {LINK_FIELD_CONFIG.map((field, index) => (
                    <div
                      className="editor-grid link-field-row"
                      style={{ marginTop: index === 0 ? 14 : 14 }}
                      key={`view-${field.titleKey}`}
                    >
                      <label className="auth-field">
                        <span>{field.titleLabel}</span>
                        <input
                          value={(activeView[field.titleKey] as string) || ""}
                          onChange={(event) => updateView(field.titleKey, event.target.value)}
                          placeholder={field.titlePlaceholder}
                        />
                        <small className="auth-message">{field.titleHint}</small>
                      </label>

                      <label className="auth-field">
                        <span>{field.typeLabel}</span>
                        <select
                          value={normalizeProfileButtonType(
                            (activeView[field.typeKey] as string) ||
                              inferProfileButtonType(activeView[field.urlKey] as string, activeView[field.titleKey] as string)
                          )}
                          onChange={(event) =>
                            updateView(field.typeKey, event.target.value as ProfileViewRecord[typeof field.typeKey])
                          }
                        >
                          {PROFILE_BUTTON_TYPES.map((buttonType) => (
                            <option key={buttonType} value={buttonType}>
                              {PROFILE_BUTTON_TYPE_LABELS[buttonType]}
                            </option>
                          ))}
                        </select>
                        <small className="auth-message">
                          {PROFILE_BUTTON_TYPE_DESCRIPTIONS[
                            normalizeProfileButtonType(
                              (activeView[field.typeKey] as string) ||
                                inferProfileButtonType(activeView[field.urlKey] as string, activeView[field.titleKey] as string)
                            )
                          ]}
                        </small>
                      </label>

                      <label className="auth-field">
                        <span>{field.urlLabel}</span>
                        <input
                          value={getProfileButtonEditorValue(
                            (activeView[field.typeKey] as string) ||
                              inferProfileButtonType(activeView[field.urlKey] as string, activeView[field.titleKey] as string),
                            (activeView[field.urlKey] as string) || ""
                          )}
                          onChange={(event) => updateView(field.urlKey, event.target.value)}
                          placeholder={PROFILE_BUTTON_TYPE_PLACEHOLDERS[
                            normalizeProfileButtonType(
                              (activeView[field.typeKey] as string) ||
                                inferProfileButtonType(activeView[field.urlKey] as string, activeView[field.titleKey] as string)
                            )
                          ]}
                        />
                        <small className="auth-message">{field.urlHint}</small>
                      </label>
                    </div>
                  ))}
                </div>

                {isMultiViewMode ? (
                  <div className="editor-actions" style={{ marginTop: 18 }}>
                    <button
                      className="button secondary"
                      type="button"
                      disabled={!activeView.id || activeView.id === defaultViewId || saving || viewSaving}
                      onClick={() => handleSetDefaultView(activeView)}
                    >
                      {activeView.id === defaultViewId
                        ? isRealEstateBusinessProfile
                          ? "Default property"
                          : "Default view"
                        : isRealEstateBusinessProfile
                          ? "Set as default property"
                          : "Set as default"}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
          ) : null}

          <details className="card collapsible-section theme-section" style={{ marginTop: 18, padding: 18 }}>
            <summary className="collapsible-summary">
              <div>
                <div className="dashboard-kicker">Profile Theme</div>
                <h3 style={{ margin: "6px 0 8px" }}>Choose a polished look.</h3>
                <p className="editor-copy">
                  Presets keep your profile sharp without needing to tune colors manually. Your plan controls which
                  themes are available.
                </p>
              </div>
              <span className="collapsible-summary-chip" aria-hidden="true">
                <span className="collapsible-summary-chip-text open">Collapse</span>
                <span className="collapsible-summary-chip-text closed">Expand</span>
                <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                  <path d="M5.5 7.5L10 12l4.5-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </summary>

            <div className="theme-section-body">
              <div className="theme-choice-list" role="radiogroup" aria-label="Profile theme">
                {PROFILE_THEME_OPTIONS.map((theme) => {
                  const allowed = themeIsAllowedForPlan(theme.key, plan.key);
                  const colors = theme.key === CUSTOM_THEME_KEY ? customThemeColors : theme.colors;

                  return (
                    <label className={`theme-choice-card${allowed ? "" : " is-disabled"}`} key={theme.key}>
                      <input
                        type="radio"
                        name="theme_key"
                        value={theme.key}
                        checked={selectedThemeKey === theme.key}
                        disabled={!allowed}
                        onChange={() => update("theme_key", theme.key)}
                      />
                      <span>
                        <strong>{theme.name}</strong>
                        <small>
                          {theme.description}
                          {!allowed ? ` Upgrade to Business Individual or a business plan to unlock.` : ""}
                        </small>
                        <span
                          className="theme-preview-strip"
                          style={{
                            "--theme-preview-primary": colors.primary,
                            "--theme-preview-secondary": colors.secondary,
                            "--theme-preview-accent": colors.accent,
                            "--theme-preview-background": colors.background,
                            "--theme-preview-text": colors.text || "#FFFFFF"
                          } as React.CSSProperties}
                          aria-hidden="true"
                        >
                          <i />
                          <i />
                          <i />
                          <i />
                          <i />
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
              {showCustomThemeColors ? (
                <div className="editor-grid theme-custom-grid">
                  <label className="auth-field">
                    <span>{THEME_COLOR_ROLE_LABELS.primary}</span>
                    <input
                      type="color"
                      value={form.brand_color_primary || designTokens.colors.primary}
                      onChange={(event) => update("brand_color_primary", event.target.value)}
                    />
                  </label>
                  <label className="auth-field">
                    <span>{THEME_COLOR_ROLE_LABELS.secondary}</span>
                    <input
                      type="color"
                      value={form.brand_color_secondary || designTokens.colors.deepBlue}
                      onChange={(event) => update("brand_color_secondary", event.target.value)}
                    />
                  </label>
                  <label className="auth-field">
                    <span>{THEME_COLOR_ROLE_LABELS.accent}</span>
                    <input
                      type="color"
                      value={form.brand_color_accent || designTokens.colors.insightGold}
                      onChange={(event) => update("brand_color_accent", event.target.value)}
                    />
                  </label>
                  <label className="auth-field">
                    <span>{THEME_COLOR_ROLE_LABELS.background}</span>
                    <input
                      type="color"
                      value={form.brand_color_background || customThemeColors.background}
                      onChange={(event) => update("brand_color_background", event.target.value)}
                    />
                  </label>
                  <label className="auth-field">
                    <span>{THEME_COLOR_ROLE_LABELS.text}</span>
                    <input
                      type="color"
                      value={form.brand_color_text || designTokens.colors.white}
                      onChange={(event) => update("brand_color_text", event.target.value)}
                    />
                  </label>
                </div>
              ) : null}
            </div>
          </details>

          <div className="card" style={{ marginTop: 24, padding: 22 }}>
            <div className="dashboard-kicker">Account flags</div>
            <div className="editor-grid">
              <label className="auth-field">
                <span>Promo code</span>
                <input
                  value={form.promo_code_used || "None"}
                  readOnly
                  disabled
                />
              </label>

              <div className="auth-field">
                <span>Access</span>
                <input
                  value={
                    form.lifetime_free
                      ? "Founder lifetime access"
                      : plan.isActivated
                        ? plan.key === "business_individual"
                          ? "Business Individual"
                          : "Business plan"
                        : "Reserved profile"
                  }
                  readOnly
                  disabled
                />
              </div>
            </div>
          </div>

          <div className="card metadata-card" style={{ marginTop: 24 }}>
            <div className="dashboard-kicker">Technical details</div>
            <h3 className="metadata-title">
              Profile access and distribution
            </h3>

            <div className="metadata-list">
              <div className="metadata-row">
                <span className="metadata-label">Public profile</span>
                <strong className="metadata-value">
                  {safeReadableUrl
                    ? safeReadableUrl.replace(/^https?:\/\//, "")
                    : "Pending approval"}
                </strong>
              </div>

              <div className="metadata-row">
                <span className="metadata-label">Card / QR</span>
                <strong className="metadata-value">
                  {safeCardUrl ? safeCardUrl.replace(/^https?:\/\//, "") : "Not ready"}
                </strong>
              </div>

              <div className="metadata-row">
                <span className="metadata-label">Status</span>
                <strong className="metadata-value">{profileStatusLabel}</strong>
              </div>

              <div className="metadata-row">
                <span className="metadata-label">Slug status</span>
                <strong className="metadata-value">{slugStatusLabel}</strong>
              </div>
            </div>
          </div>

          {error ? <p className="auth-error" style={{ marginTop: 18 }}>{error}</p> : null}
          {message ? <p className="auth-message" style={{ marginTop: 18 }}>{message}</p> : null}

          <div className="editor-actions" style={{ marginTop: 24 }}>
            <button className="button primary" type="submit" disabled={saving || viewSaving}>
              {saving || viewSaving ? "Saving..." : "Save changes"}
            </button>

            <button
              className="button secondary"
              type="button"
              onClick={copyPublicProfileUrl}
              disabled={!safeReadableUrl}
            >
              Copy public profile link
            </button>

            {safeReadableUrl ? (
              <a className="button secondary" href={safeReadableUrl} target="_blank" rel="noreferrer">
                Open public profile
              </a>
            ) : null}

            {safeCardUrl ? (
              <button className="button secondary" type="button" onClick={copyCardUrl}>
                Copy card URL
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  );
}
