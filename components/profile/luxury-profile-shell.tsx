"use client";

import Link from "next/link";
import { useState } from "react";
import { getIssuedProfileUrl, getReadableProfileUrl } from "@/lib/urls/profile-url";
import { ReportIssueForm } from "@/components/profile/report-issue-form";
import styles from "./luxury-profile-shell.module.css";

type ProfileLike = {
  id?: string | null;
  slug?: string | null;
  private_token?: string | null;
  full_name?: string | null;
  role_line?: string | null;
  intro?: string | null;
  email?: string | null;
  phone?: string | null;
  website_url?: string | null;
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
  return profile.slug ? `/api/vcard/${profile.slug}` : "#";
}

function getPills() {
  return ["Direct profile", "Direct follow-up", "Verified contact card"];
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
  if (title.includes("download contact card") || href.includes("/api/vcard/")) {
    return "Save to iPhone, Android, Outlook, or desktop contacts";
  }
  if (href.includes("signalrefinery")) {
    return "Strategic advisory, communications, and public-facing work";
  }
  if (href.includes("signalpass")) {
    return "Signal Pass profile destination";
  }
  return "Direct access";
}

function primaryLinks(profile: ProfileLike) {
  const items = [
    { title: profile.primary_link_1_title, href: profile.primary_link_1_url },
    { title: profile.primary_link_2_title, href: profile.primary_link_2_url },
    { title: profile.primary_link_3_title, href: profile.primary_link_3_url },
    {
      title: profile.primary_link_4_title || "Download contact card",
      href: profile.primary_link_4_url || contactHref(profile)
    }
  ].filter((item) => item.title && item.href);

  if (!items.some((item) => (item.href || "").includes("/api/vcard/"))) {
    items.push({
      title: "Download contact card",
      href: contactHref(profile)
    });
  }

  return items.slice(0, 4);
}

export function LuxuryProfileShell({
  profile,
  heroLabel = "Live profile",
  initialAuth = null
}: {
  profile: ProfileLike;
  heroLabel?: string;
  initialAuth?: InitialAuth;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const readableUrl = getReadableProfileUrl(profile);
  const issuedUrl = getIssuedProfileUrl(profile);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(
    issuedUrl
  )}`;
  const links = primaryLinks(profile);
  const pills = getPills();
  const intro =
    profile.intro ||
    "A cleaner way to connect, save contact details, and move the right information forward without clutter.";

  return (
    <div className={styles.page}>
      <div className={`${styles.shell} ${mobileOpen ? styles.shellMenuOpen : ""}`}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href="/">
            <span className={styles.brandStar}>✦</span>
            <span>Signal Pass</span>
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

        <section className={styles.profileHero}>
          <div className={styles.profileStack}>

            <h1 className={styles.profileName}>{profile.full_name || "Signal Pass"}</h1>

            {profile.role_line ? <p className={styles.profileRole}>{profile.role_line}</p> : null}

            <div className={styles.profileMeta}>
              {pills.map((pill) => (
                <div className={styles.metaPill} key={pill}>
                  <span className={styles.miniDot}></span>
                  <span>{pill}</span>
                </div>
              ))}
            </div>

            <div className={`${styles.ctaRow} ${styles.profileActions}`}>
              {profile.slug ? (
                <a className={`${styles.button} ${styles.profileGoldButton}`} href={`/api/vcard/${profile.slug}`}>
                  Add to Contacts
                </a>
              ) : null}

              {profile.phone ? (
                <a className={`${styles.button} ${styles.profileSubtleButton}`} href={textHref(profile.phone)}>
                  Text
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
                <a className={styles.linkCard} href={item.href || "#"} key={`${item.title}-${item.href}`}>
                  <div>
                    <div className={styles.linkTitle}>{item.title}</div>
                    <div className={styles.linkSub}>{subtitleForLink(item, profile)}</div>
                  </div>
                  <div className={styles.arrow}>↗</div>
                </a>
              ))}
            </div>

            <div className={styles.contactStrip}>
              {profile.email ? (
                <div className={styles.contactLine}>
                  <div>
                    <div className={styles.contactLabel}>Email</div>
                    <div className={styles.contactValue}>{profile.email}</div>
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
              <img className={styles.qrImage} src={qrImageUrl} alt={`QR code for ${profile.full_name || "Signal Pass"} profile`} />
            </div>
            <div className={styles.qrCaption}>
              Use on printed cards, event materials, leave-behinds, or person-to-person introductions.
            </div>
          </div>
        </section>

        <section className={styles.reportSection}>
          <ReportIssueForm profileId={profile.id || undefined} slug={profile.slug || ""} />
        </section>

        <footer className={styles.footer}>
          <span>{profile.full_name || "Signal Pass"}</span>
          <span>Signal Pass profile</span>
        </footer>
      </div>
    </div>
  );
}
