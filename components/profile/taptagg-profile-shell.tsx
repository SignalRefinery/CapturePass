"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { ProfileAnalyticsTracker, trackProfileAction } from "@/components/analytics/profile-analytics-tracker";
import { getReadableProfileUrl } from "@/lib/urls/profile-url";
import { CUSTOM_THEME_KEY, normalizeThemeKey, resolveThemeColors } from "@/lib/themes";
import { ContactShareModal } from "@/components/profile/contact-share-modal";
import { ReportIssueForm } from "@/components/profile/report-issue-form";
import styles from "./taptagg-profile-shell.module.css";

type ProfileLike = {
  id?: string | null;
  slug?: string | null;
  private_token?: string | null;
  view_id?: string | null;
  view_key?: string | null;
  view_name?: string | null;
  full_name?: string | null;
  organization_name?: string | null;
  profile_image_url?: string | null;
  brand_logo_url?: string | null;
  brand_color_primary?: string | null;
  brand_color_secondary?: string | null;
  brand_color_accent?: string | null;
  brand_color_text?: string | null;
  theme_key?: string | null;
  brand_theme?: string | null;
  role_line?: string | null;
  intro?: string | null;
  email?: string | null;
  phone?: string | null;
  website_url?: string | null;
  profile_badge_1?: string | null;
  profile_badge_2?: string | null;
  profile_badge_3?: string | null;
  show_email?: boolean | null;
  show_phone?: boolean | null;
  show_text?: boolean | null;
  show_in_public_nav?: boolean | null;
  primary_link_1_title?: string | null;
  primary_link_1_url?: string | null;
  primary_link_2_title?: string | null;
  primary_link_2_url?: string | null;
  primary_link_3_title?: string | null;
  primary_link_3_url?: string | null;
  primary_link_4_title?: string | null;
  primary_link_4_url?: string | null;
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

function formatPhone(value?: string | null) {
  const digits = digitsOnly(value);
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return value || "";
}

function textHref(phone?: string | null) {
  const digits = digitsOnly(phone);
  if (!digits) return "";
  return `sms:+${digits.length === 10 ? "1" : ""}${digits}`;
}

function contactHref(profile: ProfileLike) {
  if (profile.vcard_url) return profile.vcard_url;
  if (!profile.slug) return "#";

  const viewParam = viewShareParam(profile);
  const viewQuery = viewParam ? `?view=${encodeURIComponent(viewParam)}` : "";

  return `/api/vcard/${profile.slug}${viewQuery}`;
}

function viewShareParam(profile: ProfileLike) {
  // TapTagg renders one public profile. Stored view identifiers are ignored so
  // saved contacts, share links, and QR codes always point at the main profile.
  void profile;
  return null;
}

function publicShareUrl(profile: ProfileLike) {
  if (profile.public_url) {
    return profile.public_url;
  }

  const url = getReadableProfileUrl(profile);
  const viewParam = viewShareParam(profile);

  if (!viewParam) {
    return url;
  }

  return `${url}?view=${encodeURIComponent(viewParam)}`;
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
  const parts = (name || "TapTagg")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return (parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0]?.slice(0, 2) || "TT").toUpperCase();
}

function themeClassName(theme?: string | null) {
  const themeKey = normalizeThemeKey(theme);

  if (themeKey === "taptagg_brand") {
    return "";
  }

  if (themeKey === "clean_horizon" || themeKey === "sage_professional") {
    return themeKey === "sage_professional"
      ? `${styles.themeCleanLight} ${styles.themeSageProfessional}`
      : `${styles.themeCleanLight} ${styles.themeCleanHorizon}`;
  }

  if (themeKey === "executive_gold") {
    return styles.themeExecutiveGold;
  }

  if (themeKey === CUSTOM_THEME_KEY) {
    return styles.themeCustom;
  }

  return styles.themeDeepBrand;
}

function legacyThemeClassName(theme?: string | null) {
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

function subtitleForLink(item: { title?: string | null; href?: string | null }, profile: ProfileLike) {
  const title = (item.title || "").toLowerCase();
  const href = item.href || "";

  if (href.startsWith("tel:") || title.includes("call")) {
    return `${formatPhone(profile.phone)} · Direct line`;
  }
  if (href.startsWith("sms:") || title.includes("text")) {
    return "Send a quick message directly";
  }
  if (href.startsWith("mailto:") || title.includes("email")) {
    return "Send an email";
  }
  if (title.includes("website") || href.startsWith("http")) {
    return "Visit website";
  }
  if (title.includes("add to contacts") || href.includes("/api/vcard/")) {
    return "Save to iPhone, Android, Outlook, or desktop contacts";
  }
  if (href.includes("taptagg")) {
    return "TapTagg profile destination";
  }
  return "Open link";
}

function isMeaningfulHref(href?: string | null) {
  const normalized = (href || "").trim().toLowerCase().replace(/\/+$/, "");

  return (
    !!normalized &&
    normalized !== "www." &&
    normalized !== "https://www." &&
    normalized !== "http://www." &&
    normalized !== "example.com" &&
    normalized !== "http://example.com" &&
    normalized !== "https://example.com" &&
    normalized !== "www.example.com" &&
    normalized !== "http://www.example.com" &&
    normalized !== "https://www.example.com"
  );
}

function primaryLinks(profile: ProfileLike, options: { hideEmailLink?: boolean } = {}) {
  const showEmail = profile.show_email !== false;
  const showPhone = profile.show_phone !== false;
  const showText = profile.show_text === true;
  const hasVisibleContact = (showEmail && !!profile.email) || (showPhone && !!profile.phone);
  const items = [
    { title: profile.primary_link_1_title, href: profile.primary_link_1_url },
    { title: profile.primary_link_2_title, href: profile.primary_link_2_url },
    { title: profile.primary_link_3_title, href: profile.primary_link_3_url },
    { title: profile.primary_link_4_title, href: profile.primary_link_4_url }
  ].map((item) => ({
    title: (item.title || "").trim(),
    href: (item.href || "").trim()
  })).filter((item) => {
    const href = item.href;

    if (!item.title || !href || !isMeaningfulHref(href)) return false;
    if (!showEmail && href.startsWith("mailto:")) return false;
    if (options.hideEmailLink && href.startsWith("mailto:")) return false;
    if (!showPhone && href.startsWith("tel:")) return false;
    if (!showText && href.startsWith("sms:")) return false;

    return true;
  });

  if (
    contactHref(profile) !== "#" &&
    hasVisibleContact &&
    !items.some((item) => (item.href || "").includes("/api/vcard/") || (item.href || "").includes("/api/pass-vcard/"))
  ) {
    items.push({
      title: "Add to contacts",
      href: contactHref(profile)
    });
  }

  return items.slice(0, 4);
}

export function TapTaggProfileShell({
  profile,
  views: _views = [profile],
  navViews: _navViews,
  pageMode: _pageMode = "single",
  multiViewDisplayMode: _multiViewDisplayMode = "favorite",
  initialView: _initialView = null,
  heroLabel: _heroLabel = "Live profile",
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
  const [avatarAspectRatio, setAvatarAspectRatio] = useState<number | null>(null);
  const readableUrl = publicShareUrl(activeProfile);
  const qrReadableUrl = urlWithSource(readableUrl, "qr");
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(
    qrReadableUrl
  )}`;
  const pills = getPills(activeProfile);
  const showEmail = activeProfile.show_email !== false;
  const showPhone = activeProfile.show_phone !== false;
  const secondaryActionMode = activeProfile.show_text;
  const secondaryAction =
    secondaryActionMode === true && activeProfile.phone
      ? { label: "Text", href: textHref(activeProfile.phone) }
      : secondaryActionMode === false && showEmail && activeProfile.email
        ? { label: "Email", href: `mailto:${activeProfile.email}` }
        : null;
  const intro =
    activeProfile.intro ||
    "A cleaner way to connect, save contact details, and move the right information forward without clutter.";
  const links = primaryLinks(activeProfile, { hideEmailLink: secondaryAction?.label === "Email" });
  const displayName = activeProfile.full_name || "TapTagg";
  const descriptor = activeProfile.role_line && activeProfile.organization_name
    ? `${activeProfile.role_line} at ${activeProfile.organization_name}`
    : activeProfile.role_line || activeProfile.organization_name || "Digital contact card";
  const isBusinessProfile = activeProfile.is_business_profile === true;
  const avatarUrl =
    isBusinessProfile && activeProfile.brand_logo_url
      ? activeProfile.brand_logo_url
      : activeProfile.profile_image_url || activeProfile.brand_logo_url || null;
  const avatarIsLogo = isBusinessProfile && !!activeProfile.brand_logo_url && avatarUrl === activeProfile.brand_logo_url;
  useEffect(() => {
    setAvatarAspectRatio(null);
  }, [avatarUrl]);
  const resolvedThemeKey =
    activeProfile.theme_key && !isBusinessProfile && normalizeThemeKey(activeProfile.theme_key) === "executive_navy"
      ? "taptagg_brand"
      : activeProfile.theme_key || (activeProfile.brand_theme === "custom" ? "custom" : null);
  const resolvedThemeColors = resolveThemeColors({
    themeKey: resolvedThemeKey,
    customPrimary: activeProfile.brand_color_primary,
    customSecondary: activeProfile.brand_color_secondary,
    customAccent: activeProfile.brand_color_accent,
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
    ...(resolvedThemeColors.text ? { "--profile-text": resolvedThemeColors.text } : {})
  } as CSSProperties;
  const pageClassName = [
    styles.page,
    resolvedThemeKey ? themeClassName(resolvedThemeKey) : legacyThemeClassName(activeProfile.brand_theme)
  ].filter(Boolean).join(" ");
  const homeHref = isBusinessProfile ? activeProfile.business_home_url || readableUrl : "/";
  const businessLinks = isBusinessProfile
    ? (activeProfile.business_links || []).filter((item) => item.title && item.url)
    : [];
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
  const avatarFrameStyle = useMemo(() => {
    if (!avatarIsLogo) {
      return undefined;
    }

    const ratio = avatarAspectRatio || 1;
    const isWide = ratio >= 1.2;
    const isTall = ratio <= 0.85;
    const width = isWide ? Math.min(180, Math.max(96, Math.round(84 * ratio * 1.08))) : isTall ? 92 : 84;
    const height = isWide ? 84 : isTall ? Math.min(132, Math.max(86, Math.round(84 / Math.max(ratio, 0.5) * 1.04))) : 84;
    const radius = isWide ? 26 : isTall ? 28 : 22;

    return {
      width: `${width}px`,
      height: `${height}px`,
      borderRadius: `${radius}px`
    } as CSSProperties;
  }, [avatarAspectRatio, avatarIsLogo]);

  return (
    <div className={pageClassName} style={brandStyle}>
      <ProfileAnalyticsTracker target={analyticsTarget} />
      <div className={`${styles.shell} ${mobileOpen ? styles.shellMenuOpen : ""}`}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href="/">
            <span className={styles.brandStar}>✦</span>
            <span>TapTagg</span>
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
                style={avatarFrameStyle}
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt=""
                    onLoad={(event) => {
                      if (!avatarIsLogo) return;
                      const image = event.currentTarget;
                      if (image.naturalWidth && image.naturalHeight) {
                        setAvatarAspectRatio(image.naturalWidth / image.naturalHeight);
                      }
                    }}
                  />
                ) : (
                  <span>{initialsForName(displayName)}</span>
                )}
              </div>
              <div className={styles.profileEyebrow}>TapTagg profile</div>
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
                  className={`${styles.button} ${styles.profilePrimaryButton}`}
                  href={contactHref(activeProfile)}
                  onClick={() => trackProfileAction(analyticsTarget, { title: "Add to Contacts", href: contactHref(activeProfile) })}
                >
                  Add to Contacts
                </a>
              ) : null}

              {secondaryAction ? (
                <a
                  className={`${styles.button} ${styles.profileSubtleButton}`}
                  href={secondaryAction.href}
                  onClick={() => trackProfileAction(analyticsTarget, { title: secondaryAction.label, href: secondaryAction.href })}
                >
                  {secondaryAction.label}
                </a>
              ) : null}

              {contactShareTarget.profileId || contactShareTarget.slug ? (
                <ContactShareModal target={contactShareTarget} modalStyle={brandStyle} />
              ) : null}
            </div>

            <p className={styles.profileIntro}>{intro}</p>

            <div className={styles.heroSignalRow} aria-label="Profile features">
              <span>Contact card</span>
              <span>Direct links</span>
              <span>{showPhone ? "Text ready" : "QR ready"}</span>
            </div>
          </div>
        </section>

        <section className={styles.profileGrid}>
          <div className={styles.card}>
            <h2>Primary links</h2>
            <div className={styles.links}>
              {links.map((item) => (
                <a
                  className={styles.linkCard}
                  href={item.href || "#"}
                  key={`${activeProfile.view_id || activeProfile.view_key || "profile"}-${item.title}-${item.href}`}
                  onClick={() => trackProfileAction(analyticsTarget, item)}
                >
                  <div>
                    <div className={styles.linkTitle}>{item.title}</div>
                    <div className={styles.linkSub}>{subtitleForLink(item, activeProfile)}</div>
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
                        <div className={styles.contactLabel}>{item.title}</div>
                        <div className={styles.contactValue}>{item.url.replace(/^https?:\/\//, "")}</div>
                      </div>
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
                alt={`QR code for ${activeProfile.full_name || "TapTagg"} profile`}
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
                  <div className={styles.signupCtaKicker}>TapTagg</div>
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
          <span>{activeProfile.full_name || "TapTagg"}</span>
          <span>TapTagg profile</span>
        </footer>
      </div>
    </div>
  );
}
