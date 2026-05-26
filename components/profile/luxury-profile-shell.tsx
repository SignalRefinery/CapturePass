"use client";

import Link from "next/link";
import { useState } from "react";
import { getReadableProfileUrl } from "@/lib/urls/profile-url";
import { ReportIssueForm } from "@/components/profile/report-issue-form";
import styles from "./luxury-profile-shell.module.css";

type ProfileLike = {
  id?: string | null;
  slug?: string | null;
  private_token?: string | null;
  view_id?: string | null;
  view_key?: string | null;
  view_name?: string | null;
  full_name?: string | null;
  organization_name?: string | null;
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
  if (!profile.slug) return "#";

  const viewParam = viewShareParam(profile);
  const viewQuery = viewParam ? `?view=${encodeURIComponent(viewParam)}` : "";

  return `/api/vcard/${profile.slug}${viewQuery}`;
}

function viewShareParam(profile: ProfileLike) {
  if (profile.view_id) {
    return profile.view_id;
  }

  const viewKey = profile.view_key?.trim();

  if (viewKey && viewKey !== "profile") {
    return viewKey;
  }

  return null;
}

function publicShareUrl(profile: ProfileLike) {
  const url = getReadableProfileUrl(profile);
  const viewParam = viewShareParam(profile);

  if (!viewParam) {
    return url;
  }

  return `${url}?view=${encodeURIComponent(viewParam)}`;
}

function getPills(profile: ProfileLike) {
  return [
    profile.profile_badge_1,
    profile.profile_badge_2,
    profile.profile_badge_3
  ].filter((pill): pill is string => !!pill?.trim());
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
  if (title.includes("add to contacts") || href.includes("/api/vcard/")) {
    return "Save to iPhone, Android, Outlook, or desktop contacts";
  }
  if (href.includes("taptagg")) {
    return "TapTagg profile destination";
  }
  return "Open instantly";
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
    profile.slug &&
    hasVisibleContact &&
    !items.some((item) => (item.href || "").includes("/api/vcard/"))
  ) {
    items.push({
      title: "Add to contacts",
      href: contactHref(profile)
    });
  }

  return items.slice(0, 4);
}

export function LuxuryProfileShell({
  profile,
  views = [profile],
  navViews,
  pageMode = "single",
  multiViewDisplayMode = "favorite",
  initialView = null,
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
  const viewOptions = views.length ? views : [profile];
  const publicNavOptions = navViews?.length
    ? navViews
    : viewOptions.filter((view) => view.show_in_public_nav !== false);
  const viewNavOptions = publicNavOptions.length ? publicNavOptions : [profile];
  const showViewSwitcher = pageMode === "multi" && viewNavOptions.length > 1;
  const requestedInitialView =
    pageMode === "multi" && initialView
      ? viewOptions.find((view) => view.view_key === initialView || view.view_id === initialView)
      : null;
  const [activeViewId, setActiveViewId] = useState(
    requestedInitialView?.view_id || requestedInitialView?.view_key || profile.view_id || profile.view_key || "profile"
  );
  const [landingSelected, setLandingSelected] = useState(
    !showViewSwitcher || multiViewDisplayMode !== "landing" || !!requestedInitialView
  );
  const activeProfile =
    viewOptions.find((view) => (view.view_id || view.view_key || "profile") === activeViewId) ||
    profile;
  const readableUrl = publicShareUrl(activeProfile);
  const qrViewParam = viewShareParam(activeProfile) || "profile";
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(
    readableUrl
  )}&view=${encodeURIComponent(qrViewParam)}`;
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

  function selectView(view: ProfileLike) {
    setActiveViewId(view.view_id || view.view_key || "profile");
    setLandingSelected(true);
  }

  return (
    <div className={styles.page}>
      <div className={`${styles.shell} ${mobileOpen ? styles.shellMenuOpen : ""}`}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href="/">
            <span className={styles.brandStar}>✦</span>
            <span>TapTagg</span>
          </Link>

          <nav className={styles.nav}>
            <Link href="/">Home</Link>
            <Link href="/how-it-works">How it works</Link>
            {initialAuth ? <Link href="/dashboard">Dashboard</Link> : <Link href="/login">Log in</Link>}
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
                <Link href="/" onClick={() => setMobileOpen(false)}>
                  Home
                </Link>
                {initialAuth ? (
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

              <Link
                className={styles.profileUpgradeCta}
                href={initialAuth ? "/dashboard" : "/signup"}
                onClick={() => setMobileOpen(false)}
              >
                {initialAuth ? "Go to your dashboard" : "Want to upgrade how you connect?"}
              </Link>
            </div>
          </div>
        ) : null}

        {showViewSwitcher && multiViewDisplayMode === "landing" && !landingSelected ? (
          <section className={styles.viewLanding}>
            <div className={styles.kicker}>
              <span className={styles.miniStar}>✦</span>
              <span>{heroLabel}</span>
            </div>
            <h1 className={styles.viewLandingTitle}>{activeProfile.full_name || "TapTagg"}</h1>
            {activeProfile.role_line ? (
              <p className={styles.viewLandingCopy}>{activeProfile.role_line}</p>
            ) : null}
            <div className={styles.viewSelectorGrid}>
              {viewNavOptions.map((view) => (
                <button
                  className={styles.viewSelectorCard}
                  type="button"
                  key={view.view_id || view.view_key || view.view_name || view.full_name}
                  onClick={() => selectView(view)}
                >
                  <span>{view.view_name || view.full_name || "Profile view"}</span>
                  {view.role_line ? <small>{view.role_line}</small> : null}
                  <strong>Open view</strong>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {showViewSwitcher && landingSelected ? (
          <div className={styles.viewTabs} aria-label="Profile views">
            {viewNavOptions.map((view) => {
              const viewId = view.view_id || view.view_key || "profile";
              const active = viewId === activeViewId;

              return (
                <button
                  className={`${styles.viewTab} ${active ? styles.viewTabActive : ""}`}
                  type="button"
                  key={viewId}
                  onClick={() => selectView(view)}
                  aria-pressed={active}
                >
                  {view.view_name || view.full_name || "Profile view"}
                </button>
              );
            })}
          </div>
        ) : null}

        {landingSelected ? (
          <>
        <section className={styles.profileHero}>
          <div className={styles.profileStack}>

            <h1 className={styles.profileName}>{activeProfile.full_name || "TapTagg"}</h1>

            {activeProfile.role_line ? <p className={styles.profileRole}>{activeProfile.role_line}</p> : null}

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
              {activeProfile.slug && (showEmail || showPhone) ? (
                <a className={`${styles.button} ${styles.profileGoldButton}`} href={contactHref(activeProfile)}>
                  Add to Contacts
                </a>
              ) : null}

              {secondaryAction ? (
                <a className={`${styles.button} ${styles.profileSubtleButton}`} href={secondaryAction.href}>
                  {secondaryAction.label}
                </a>
              ) : null}
            </div>

            <p className={styles.profileIntro}>{intro}</p>
          </div>
        </section>

        <section className={styles.profileGrid}>
          <div className={styles.card}>
            <h2>Primary links</h2>
            <div className={styles.links}>
              {links.map((item) => (
                <a className={styles.linkCard} href={item.href || "#"} key={`${activeProfile.view_id || activeProfile.view_key || "profile"}-${item.title}-${item.href}`}>
                  <div>
                    <div className={styles.linkTitle}>{item.title}</div>
                    <div className={styles.linkSub}>{subtitleForLink(item, activeProfile)}</div>
                  </div>
                  <div className={styles.arrow}>↗</div>
                </a>
              ))}
            </div>

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
            <Link className={`${styles.button} ${styles.profileGoldButton}`} href="/signup">
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
