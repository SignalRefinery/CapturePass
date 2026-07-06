"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { UserMenu } from "@/components/auth/user-menu";
import { isCapturePassBootstrapAdminEmail } from "@/lib/auth/admin-shared";
import { CapturePassBrandArt } from "@/components/shared/capturepass-brand-art";

const PUBLIC_NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/business/pricing", label: "Business Pricing" },
  { href: "/business", label: "Business" },
  { href: "/partners", label: "Partners" },
];

export function Shell({
  children,
  navLinks,
  footerLeft,
  footerRight,
  myProfileHref = null,
  initialAuth,
  pageVariant = "light",
}: {
  children: React.ReactNode;
  navLinks?: { href: string; label: string }[];
  footerLeft?: string;
  footerRight?: string;
  myProfileHref?: string | null;
  initialAuth?: {
    email?: string | null;
    fullName?: string | null;
    slug?: string | null;
    isAdmin?: boolean | null;
  } | null;
  pageVariant?: "default" | "admin" | "light";
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const isSignedIn = !!initialAuth?.email;
  const isAdmin = !!initialAuth?.isAdmin || isCapturePassBootstrapAdminEmail(initialAuth?.email);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 860) {
        setMobileOpen(false);
      }
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const profileHref = useMemo(() => {
    if (myProfileHref) return myProfileHref;
    if (initialAuth?.slug) return `/${initialAuth.slug}`;
    return null;
  }, [myProfileHref, initialAuth?.slug]);

  const effectiveNavLinks = useMemo(() => {
    if (!isSignedIn) {
      return navLinks?.length ? navLinks : PUBLIC_NAV_LINKS;
    }

    const links = [
      { href: "/", label: "Home" },
      { href: "/business/pricing", label: "Business Pricing" },
      { href: "/business", label: "Business" },
      { href: "/partners", label: "Partners" },
      { href: "/dashboard#performance", label: "Performance" },
      { href: "/dashboard/contacts", label: "Contacts" },
      { href: "/dashboard/analytics", label: "Analytics" },
    ];

    if (profileHref) {
      links.push({ href: profileHref, label: "My profile" });
    }

    if (isAdmin) {
      links.push({ href: "/dashboard/business", label: "Business admin" });
      links.push({ href: "/admin", label: "Admin" });
    }

    return links;
  }, [isSignedIn, isAdmin, profileHref, navLinks]);

  return (
    <div
      className={
        pageVariant === "admin"
          ? "page page-admin"
          : pageVariant === "light"
            ? "page page-light"
            : "page"
      }
    >
      <div className={`shell ${mobileOpen ? "shell-menu-open" : ""}`}>
        <header className="topbar">
          <Link className="brand" href="/">
            <CapturePassBrandArt className="brand-logo brand-logo-lockup" variant="logoLockup" />
          </Link>

          <div className="desktop-nav-wrap">
            <nav className="nav">
              {effectiveNavLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </nav>

            {isSignedIn ? (
              <div style={{ marginLeft: "34px" }}>
                <UserMenu
                  initialEmail={initialAuth?.email || null}
                  initialFullName={initialAuth?.fullName || null}
                  initialSlug={initialAuth?.slug || null}
                  initialIsAdmin={isAdmin}
                />
              </div>
            ) : (
              <div
                className="auth-buttons"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "42px",
                  marginLeft: "34px",
                }}
              >
                <Link href="/login" style={{ whiteSpace: "nowrap" }}>
                  Sign in
                </Link>
                <Link href="/business/pricing" className="button primary">
                  Get started
                </Link>
              </div>
            )}
          </div>

          <button
            className={mobileOpen ? "mobile-menu-toggle is-open" : "mobile-menu-toggle"}
            type="button"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((c) => !c)}
          >
            <span />
            <span />
            <span />
          </button>
        </header>

        {mobileOpen && (
          <div className="mobile-menu-overlay">
            <div className="mobile-menu-panel">
              <nav className="mobile-nav">
                {effectiveNavLinks.map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                    {link.label}
                  </Link>
                ))}
              </nav>

              <UserMenu
                mobile
                initialEmail={initialAuth?.email || null}
                initialFullName={initialAuth?.fullName || null}
                initialSlug={initialAuth?.slug || null}
                initialIsAdmin={isAdmin}
              />
            </div>
          </div>
        )}

        <main>{children}</main>

        <footer className="footer">
          <span>{footerLeft}</span>
          <span>{footerRight}</span>
        </footer>
      </div>
    </div>
  );
}
