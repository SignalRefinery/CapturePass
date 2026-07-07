"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useState } from "react";
import { ProfileAnalyticsTracker, trackProfileAction } from "@/components/analytics/profile-analytics-tracker";
import { CapturePassBrandArt } from "@/components/shared/capturepass-brand-art";
import { getReadableProfileUrl } from "@/lib/urls/profile-url";
import { CUSTOM_THEME_KEY, normalizeThemeKey, resolveThemeColors, themeUsesLightShell } from "@/lib/themes";
import { ContactShareModal } from "@/components/profile/contact-share-modal";
import { ReportIssueForm } from "@/components/profile/report-issue-form";
import { buildProfileButtons, getProfileButtonAnalyticsContext } from "@/lib/profile-buttons";
import styles from "./taptagg-profile-shell.module.css";

type ProfileLike = {
  id?: string | null;
  slug?: string | null;
  business_type?: string | null;
  view_id?: string | null;
  view_key?: string | null;
  view_name?: string | null;
  full_name?: string | null;
  organization_name?: string | null;
  profile_image_url?: string | null;
  brand_logo_url?: string | null;
  is_business_individual?: boolean | null;
  brand_color_primary?: string | null;
  brand_color_secondary?: string | null;
  brand_color_accent?: string | null;
  brand_color_background?: string | null;
  brand_color_text?: string | null;
  theme_key?: string | null;
  brand_theme?: string | null;
  role_line?: string | null;
  intro?: string | null;
  business_tagline?: string | null;
  email?: string | null;
  phone?: string | null;
  website_url?: string | null;
  profile_badge_1?: string | null;
  profile_badge_2?: string | null;
  profile_badge_3?: string | null;
  show_email?: boolean | null;
  show_phone?: boolean | null;
  show_text?: boolean | null;
  secondary_action_mode?: string | null;
  text_phone?: string | null;
  show_in_public_nav?: boolean | null;
  primary_link_1_title?: string | null;
  primary_link_1_url?: string | null;
  primary_link_1_type?: string | null;
  primary_link_2_title?: string | null;
  primary_link_2_url?: string | null;
  primary_link_2_type?: string | null;
  primary_link_3_title?: string | null;
  primary_link_3_url?: string | null;
  primary_link_3_type?: string | null;
  primary_link_4_title?: string | null;
  primary_link_4_url?: string | null;
  primary_link_4_type?: string | null;
  public_url?: string | null;
  vcard_url?: string | null;
  business_home_url?: string | null;
  is_business_profile?: boolean | null;
  contact_share_profile_id?: string | null;
  contact_share_organization_id?: string | null;
  analytics_profile_id?: string | null;
  analytics_organization_id?: string | null;
  analytics_organization_member_id?: string | null;
  analytics_card_id?: string | null;
  business_links?: Array<{ title: string; url: string }> | null;
};

type InitialAuth = {
  email?: string | null;
  fullName?: string | null;
  slug?: string | null;
} | null;

function digitsOnly(value?: string | null) {
  return (value || "").replace(/\D/g, "");
}

function hexToRgbString(value?: string | null) {
  const normalized = (value || "").trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }

  const hex = normalized.slice(1);
  return `${Number.parseInt(hex.slice(0, 2), 16)}, ${Number.parseInt(hex.slice(2, 4), 16)}, ${Number.parseInt(
    hex.slice(4, 6),
    16
  )}`;
}

function callHref(phone?: string | null) {
  const digits = digitsOnly(phone);
  if (!digits) return "";
  return `tel:+${digits.length === 10 ? "1" : ""}${digits}`;
}

function textHref(phone?: string | null) {
  const digits = digitsOnly(phone);
  if (!digits) return "";
  return `sms:+${digits.length === 10 ? "1" : ""}${digits}`;
}

function contactHref(profile: ProfileLike) {
  if (profile.vcard_url) return profile.vcard_url;
  if (!profile.slug) return "#";

  return `/api/vcard/${profile.slug}`;
}

function contactDownloadFilename(profile: ProfileLike) {
  const base = (profile.full_name || profile.organization_name || profile.slug || "capturepass-contact")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${base || "capturepass-contact"}.vcf`;
}

async function downloadVcardFromUrl(url: string, filename: string) {
  const response = await fetch(url, { credentials: "same-origin" });
  if (!response.ok) {
    throw new Error(`Failed to download vCard: ${response.status}`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

function publicShareUrl(profile: ProfileLike) {
  if (profile.public_url) {
    return profile.public_url;
  }

  return getReadableProfileUrl(profile);
}

function urlWithSource(url: string, source: string) {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("source", source);
    return parsed.toString();
  } catch {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}source=${encodeURIComponent(source)}`;
  }
}

function getPills(profile: ProfileLike) {
  return [
    profile.profile_badge_1,
    profile.profile_badge_2,
    profile.profile_badge_3
  ].filter((pill): pill is string => !!pill?.trim());
}

function initialsForName(name?: string | null) {
  const parts = (name || "CapturePass")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return (parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0]?.slice(0, 2) || "TT").toUpperCase();
}

function themeClassName(theme?: string | null, background?: string | null) {
  const themeKey = normalizeThemeKey(theme);

  if (themeKey === "capturepass_brand") {
    return styles.themeCleanLight;
  }

  if (themeKey === "sage_professional") {
    return `${styles.themeCleanLight} ${styles.themeSageProfessional}`;
  }

  if (themeKey === "executive_gold") {
    return styles.themeExecutiveGold;
  }

  if (themeKey === CUSTOM_THEME_KEY) {
    return styles.themeCustom;
  }

  return themeUsesLightShell(themeKey, background) ? styles.themeCleanLight : styles.themeDeepBrand;
}

function legacyThemeClassName(theme?: string | null) {
  // Older business pass rows stored brand_theme instead of theme_key. Keep this
  // isolated fallback so stored passes render without making these public labels.
  switch (theme) {
    case "deep_brand":
      return styles.themeDeepBrand;
    case "clean_light":
      return styles.themeCleanLight;
    case "full_color":
      return styles.themeDeepBrand;
    case "custom":
      return styles.themeCustom;
    default:
      return "";
  }
}

export function CapturePassProfileShell({
  profile,
  views: _views = [profile],
  navViews = [],
  pageMode = "single",
  multiViewDisplayMode = "favorite",
  initialView: _initialView = null,
  heroLabel = "Live profile",
  initialAuth = null
}: {
  profile: ProfileLike;
  views?: ProfileLike[];
  navViews?: ProfileLike[];
  pageMode?: "single" | "multi";
  multiViewDisplayMode?: "landing" | "favorite";
  initialView?: string | null;
  heroLabel?: string;
  initialAuth?: InitialAuth;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeProfile = profile;
  const readableUrl = publicShareUrl(activeProfile);
  const qrReadableUrl = urlWithSource(readableUrl, "qr");
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(
    qrReadableUrl
  )}`;
  const pills = getPills(activeProfile);
  const showEmail = activeProfile.show_email !== false;
  const showPhone = activeProfile.show_phone !== false;
  const showText = activeProfile.show_text !== false;
  const contactUrl = contactHref(activeProfile);
  const contactFilename = contactDownloadFilename(activeProfile);
  const textPhone = activeProfile.text_phone || activeProfile.phone || "";
  const quickActions = [
    showPhone && activeProfile.phone
      ? { label: "Call", href: callHref(activeProfile.phone), title: "Call" }
      : null,
    showText && textPhone
      ? { label: "Text", href: textHref(textPhone), title: "Text" }
      : null,
    showEmail && activeProfile.email
      ? { label: "Email", href: `mailto:${activeProfile.email}`, title: "Email" }
      : null
  ] as const;
  const visibleQuickActions = quickActions.filter((action): action is NonNullable<(typeof quickActions)[number]> => !!action);
  const intro =
    activeProfile.intro ||
    "A cleaner way to connect, save contact details, and move the right information forward without clutter.";
  const links = buildProfileButtons(activeProfile, {
    hideEmail: !!activeProfile.email
  });
  const displayName = activeProfile.full_name || "CapturePass";
  const descriptor = activeProfile.role_line && activeProfile.organization_name
    ? `${activeProfile.role_line} at ${activeProfile.organization_name}`
    : activeProfile.role_line || activeProfile.organization_name || "CapturePass contact card";
  const isBusinessProfile = activeProfile.is_business_profile === true;
  const useWideLogo = !!activeProfile.brand_logo_url || isBusinessProfile || activeProfile.is_business_individual === true;
  const avatarUrl =
    useWideLogo && activeProfile.brand_logo_url
      ? activeProfile.brand_logo_url
      : activeProfile.profile_image_url || activeProfile.brand_logo_url || null;
  const avatarIsLogo = !!activeProfile.brand_logo_url && avatarUrl === activeProfile.brand_logo_url;
  const resolvedThemeKey =
    activeProfile.theme_key && !isBusinessProfile && normalizeThemeKey(activeProfile.theme_key) === "executive_navy"
      ? "capturepass_brand"
      : activeProfile.theme_key || (activeProfile.brand_theme === "custom" ? "custom" : null);
  const resolvedThemeColors = resolveThemeColors({
    themeKey: resolvedThemeKey,
    customPrimary: activeProfile.brand_color_primary,
    customSecondary: activeProfile.brand_color_secondary,
    customAccent: activeProfile.brand_color_accent,
    customBackground: activeProfile.brand_color_background,
    customText: activeProfile.brand_color_text
  });
  const brandStyle = {
    "--profile-cta": resolvedThemeColors.primary,
    "--profile-icon": resolvedThemeColors.secondary,
    "--profile-glow": resolvedThemeColors.accent,
    "--profile-primary": resolvedThemeColors.primary,
    "--profile-secondary": resolvedThemeColors.secondary,
    "--profile-accent": resolvedThemeColors.accent,
    "--profile-background": resolvedThemeColors.background,
    "--profile-primary-rgb": hexToRgbString(resolvedThemeColors.primary),
    "--profile-secondary-rgb": hexToRgbString(resolvedThemeColors.secondary),
    "--profile-accent-rgb": hexToRgbString(resolvedThemeColors.accent),
    "--profile-background-rgb": hexToRgbString(resolvedThemeColors.background),
    "--profile-text-rgb": hexToRgbString(resolvedThemeColors.text || null),
    ...(resolvedThemeColors.text ? { "--profile-text": resolvedThemeColors.text } : {})
  } as CSSProperties;
  const avatarStyle = {
    "--profile-avatar-bg": avatarIsLogo
      ? "var(--profile-background, #ffffff)"
      : "var(--profile-icon, var(--profile-secondary))"
  } as CSSProperties;
  const pageClassName = [
    styles.page,
    resolvedThemeKey
      ? themeClassName(resolvedThemeKey, resolvedThemeColors.background)
      : legacyThemeClassName(activeProfile.brand_theme)
  ].filter(Boolean).join(" ");
  const profileLabel = activeProfile.business_tagline?.trim() || heroLabel || "Live profile";
  const homeHref = isBusinessProfile ? activeProfile.business_home_url || readableUrl : "/";
  const businessLinks = isBusinessProfile
    ? (activeProfile.business_links || []).filter((item) => item.title && item.url)
    : [];
  const visibleNavViews = navViews.filter((view) => view.show_in_public_nav !== false);
  const viewSwitcherCopy =
    multiViewDisplayMode === "landing"
      ? "Choose a property or return to the main profile."
      : "Choose a featured property or return to the main profile.";
  const contactShareTarget = {
    profileId: activeProfile.contact_share_profile_id || activeProfile.id || null,
    slug: activeProfile.slug || null,
    viewId: activeProfile.view_id || null,
    organizationId: activeProfile.contact_share_organization_id || null,
    source: isBusinessProfile ? "business_profile" : "public_profile"
  };
  const analyticsTarget = {
    profileId: activeProfile.analytics_profile_id || (!isBusinessProfile ? activeProfile.id : null) || null,
    slug: activeProfile.slug || null,
    organizationId: activeProfile.analytics_organization_id || activeProfile.contact_share_organization_id || null,
    organizationMemberId: activeProfile.analytics_organization_member_id || (isBusinessProfile ? activeProfile.contact_share_profile_id : null) || null,
    profileViewId: activeProfile.view_id || null,
    cardId: activeProfile.analytics_card_id || null
  };
  return (
    <div className={pageClassName} style={brandStyle}>
      <ProfileAnalyticsTracker target={analyticsTarget} />
      <div className={`${styles.shell} ${mobileOpen ? styles.shellMenuOpen : ""}`}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href="/">
            <CapturePassBrandArt className={styles.brandLogoLockup} variant="logoLockup" />
          </Link>

          <nav className={styles.nav}>
            <Link href={homeHref}>Home</Link>
            {!isBusinessProfile ? <Link href="/how-it-works">How it works</Link> : null}
            {!isBusinessProfile ? (
              initialAuth ? <Link href="/dashboard">Dashboard</Link> : <Link href="/login">Log in</Link>
            ) : null}
          </nav>

          <button
            className={mobileOpen ? `${styles.mobileMenuToggle} ${styles.isOpen}` : styles.mobileMenuToggle}
            type="button"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((current) => !current)}
          >
            <span />
            <span />
            <span />
          </button>
        </header>

        {mobileOpen ? (
          <div className={styles.mobileMenuOverlay}>
            <div className={styles.mobileMenuPanel}>
              <nav className={styles.mobileNav}>
                <Link href={homeHref} onClick={() => setMobileOpen(false)}>
                  Home
                </Link>
                {isBusinessProfile ? null : initialAuth ? (
                  <>
                    <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                      Dashboard
                    </Link>
                    <Link href="/account" onClick={() => setMobileOpen(false)}>
                      Account
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      Log in
                    </Link>
                    <Link href="/signup" onClick={() => setMobileOpen(false)}>
                      Sign up
                    </Link>
                  </>
                )}
              </nav>

              {!isBusinessProfile ? (
                <Link
                  className={styles.profileUpgradeCta}
                  href={initialAuth ? "/dashboard" : "/signup"}
                  onClick={() => setMobileOpen(false)}
                >
                  {initialAuth ? "Go to your dashboard" : "Want to upgrade how you connect?"}
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}

        <section className={styles.profileHero}>
          <div className={styles.profileStack}>
            <div className={styles.profileIdentity}>
              <div
                className={`${styles.profileAvatar}${avatarIsLogo ? ` ${styles.profileAvatarLogo}` : ""}`}
                aria-hidden="true"
                style={avatarStyle}
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" />
                ) : (
                  <span>{initialsForName(displayName)}</span>
                )}
              </div>
              <div className={styles.profileEyebrow}>{profileLabel}</div>
            </div>

            <h1 className={styles.profileName}>{displayName}</h1>

            <p className={styles.profileRole}>{descriptor}</p>

            {pills.length ? (
              <div className={styles.profileMeta}>
                {pills.map((pill) => (
                  <div className={styles.metaPill} key={pill}>
                    <span className={styles.miniDot}></span>
                    <span>{pill}</span>
                  </div>
                ))}
              </div>
            ) : null}

            <div className={`${styles.ctaRow} ${styles.profileActions}`}>
              {contactHref(activeProfile) !== "#" && (showEmail || showPhone) ? (
                <a
                  className={`${styles.button} ${styles.profilePrimaryButton} ${styles.profileStackButton}`}
                  href={contactUrl}
                  download={contactFilename}
                  onClick={async (event) => {
                    event.preventDefault();
                    trackProfileAction(analyticsTarget, { title: "Add to Contacts", href: contactUrl });

                    try {
                      await downloadVcardFromUrl(contactUrl, contactFilename);
                    } catch {
                      window.location.href = contactUrl;
                    }
                  }}
                >
                  Add to Contacts
                </a>
              ) : null}

              <div className={styles.profileQuickActions} aria-label="Quick contact actions">
                {quickActions.map((action, index) =>
                  action ? (
                    <a
                      key={action.label}
                      className={`${styles.button} ${styles.profileSubtleButton} ${styles.profileStackButton} ${styles.profileQuickActionButton}`}
                      href={action.href}
                      onClick={() =>
                        trackProfileAction(analyticsTarget, {
                          title: action.label,
                          href: action.href
                        })
                      }
                    >
                      {action.label}
                    </a>
                  ) : (
                    <span
                      key={`quick-action-${index}`}
                      className={`${styles.button} ${styles.profileSubtleButton} ${styles.profileStackButton} ${styles.profileQuickActionButton} ${styles.profileQuickActionPlaceholder}`}
                      aria-hidden="true"
                    >
                      {["Call", "Text", "Email"][index]}
                    </span>
                  )
                )}
              </div>

              {contactShareTarget.profileId || contactShareTarget.slug ? (
                <ContactShareModal
                  target={contactShareTarget}
                  modalStyle={brandStyle}
                  buttonClassName={styles.profileStackButton}
                />
              ) : null}
            </div>

            <p className={styles.profileIntro}>{intro}</p>

            {visibleNavViews.length > 1 ? (
              <section style={{ display: "grid", gap: 12, marginTop: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                  <div>
                    <div className={styles.profileEyebrow}>
                      {pageMode === "multi" ? "Properties" : "Views"}
                    </div>
                    <p style={{ margin: "6px 0 0", color: "var(--profile-text, inherit)", opacity: 0.76 }}>
                      {viewSwitcherCopy}
                    </p>
                  </div>
                  <span className={styles.metaPill}>{visibleNavViews.length} available</span>
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {visibleNavViews.map((view) => {
                    const isActive = view.view_id === activeProfile.view_id;
                    const href = view.public_url || publicShareUrl(view);
                    const title = view.view_name && view.view_name !== "Profile" ? view.view_name : "Main Profile";
                    const subtitle =
                      view.view_id === activeProfile.view_id
                        ? "Currently selected"
                        : view.role_line || view.organization_name || "";

                    return (
                      <Link
                        key={view.view_id || view.view_key || view.slug || title}
                        className={
                          isActive
                            ? `${styles.button} ${styles.profilePrimaryButton} ${styles.profileStackButton}`
                            : `${styles.button} ${styles.profileSubtleButton} ${styles.profileStackButton}`
                        }
                        href={href}
                        onClick={() =>
                          trackProfileAction(analyticsTarget, {
                            title,
                            href
                          })
                        }
                      >
                        <span style={{ display: "grid", gap: 2 }}>
                          <span>{title}</span>
                          {subtitle ? (
                            <small style={{ opacity: 0.72, fontSize: 12, fontWeight: 500 }}>{subtitle}</small>
                          ) : null}
                        </span>
                        <span className={styles.arrow}>↗</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <div className={styles.heroSignalRow} aria-label="Profile features">
              <span>Contact card</span>
              <span>Direct links</span>
              <span>
                {visibleQuickActions.length
                  ? `${visibleQuickActions.map((action) => action.label).join(" / ")} ready`
                  : "QR ready"}
              </span>
            </div>
          </div>
        </section>

        <section className={styles.profileGrid}>
          <div className={styles.card}>
              <div className={styles.links}>
                {links.map((item, index) => (
                  <a
                    className={styles.linkCard}
                    href={item.href || "#"}
                    key={`${activeProfile.view_id || activeProfile.view_key || "profile"}-${item.title}-${item.href}`}
                    onClick={() =>
                      trackProfileAction(
                        analyticsTarget,
                        item,
                        getProfileButtonAnalyticsContext(item, index + 1)
                      )
                    }
                  >
                    <div>
                      <div className={styles.linkTitle}>{item.title}</div>
                    </div>
                    <div className={styles.arrow}>↗</div>
                  </a>
                ))}
              </div>

            {isBusinessProfile ? (
              businessLinks.length ? (
                <div className={styles.contactStrip}>
                  {businessLinks.map((item) => (
                    <a
                      className={styles.contactLine}
                      href={item.url}
                      key={`${item.title}-${item.url}`}
                      onClick={() => trackProfileAction(analyticsTarget, { title: item.title, href: item.url })}
                    >
                      <div>
                        <div className={styles.linkTitle}>{item.title}</div>
                      </div>
                      <div className={styles.arrow}>↗</div>
                    </a>
                  ))}
                </div>
              ) : null
            ) : (
              <div className={styles.contactStrip}>
                {showEmail && activeProfile.email ? (
                  <div className={styles.contactLine}>
                    <div>
                      <div className={styles.contactLabel}>Email</div>
                      <div className={styles.contactValue}>{activeProfile.email}</div>
                    </div>
                  </div>
                ) : null}

                <div className={styles.contactLine}>
                  <div>
                    <div className={styles.contactLabel}>Profile URL</div>
                    <div className={styles.contactValue}>{readableUrl.replace(/^https?:\/\//, "")}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={`${styles.card} ${styles.qrBox}`}>
            <h2>Scan to open</h2>
            <div className={styles.qrFrame}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={styles.qrImage}
                key={readableUrl}
                src={qrImageUrl}
                alt={`QR code for ${activeProfile.full_name || "CapturePass"} profile`}
              />
            </div>
            <div className={styles.qrCaption}>
              Use on printed cards, event materials, leave-behinds, or person-to-person introductions.
            </div>
          </div>
        </section>

        {!isBusinessProfile ? (
          <>
            <section className={styles.reportSection}>
              <ReportIssueForm profileId={activeProfile.id || undefined} slug={activeProfile.slug || ""} />
            </section>

            <section className={styles.signupCtaSection}>
              <div className={styles.signupCta}>
                <div>
                  <div className={styles.signupCtaKicker}>CapturePass</div>
                  <h2>Level up how you network.</h2>
                  <p>
                    Build a polished profile, share the right links, and make every follow-up easier.
                  </p>
                </div>
                <Link className={`${styles.button} ${styles.profilePrimaryButton}`} href="/signup">
                  Create your profile
                </Link>
              </div>
            </section>
          </>
        ) : null}

        <footer className={styles.footer}>
          <span>{activeProfile.full_name || "CapturePass"}</span>
          <span>{profileLabel}</span>
        </footer>
      </div>
    </div>
  );
}

export { CapturePassProfileShell as TapTaggProfileShell };
