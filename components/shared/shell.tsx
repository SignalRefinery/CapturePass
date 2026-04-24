"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { UserMenu } from "@/components/auth/user-menu";

const ADMIN_EMAILS = ["john@signalrefinery.pro"];

const PUBLIC_NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/partners", label: "Partners" },
];

export function Shell({
  children,
  navLinks: _navLinks,
  footerLeft,
  footerRight,
  myProfileHref = null,
  initialAuth,
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
  } | null;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const isSignedIn = !!initialAuth?.email;
  const isAdmin = !!initialAuth?.email && ADMIN_EMAILS.includes(initialAuth.email.toLowerCase());

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
    const links = [...PUBLIC_NAV_LINKS];

    if (isSignedIn) {
      links.push({ href: "/dashboard", label: "Dashboard" });
      links.push({ href: "/account", label: "Account" });
    } else {
      links.push({ href: "/login", label: "Log in" });
      links.push({ href: "/signup", label: "Sign up" });
    }

    if (isAdmin) {
      links.push({ href: "/admin", label: "Admin" });
    }

    return links;
  }, [isSignedIn, isAdmin]);

  return (
    <div className="page">
      <div className={`shell ${mobileOpen ? "shell-menu-open" : ""}`}>
        <header className="topbar">
          <Link className="brand" href="/">
            <span className="brand-star">✦</span>
            <span>Signal Pass</span>
          </Link>

          <div className="desktop-nav-wrap">
            <nav className="nav">
              {effectiveNavLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}

              {profileHref && <Link href={profileHref}>My profile</Link>}
            </nav>

            <UserMenu
              initialEmail={initialAuth?.email || null}
              initialFullName={initialAuth?.fullName || null}
              initialSlug={initialAuth?.slug || null}
            />
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

                {profileHref && (
                  <Link href={profileHref} onClick={() => setMobileOpen(false)}>
                    My profile
                  </Link>
                )}
              </nav>

              <UserMenu
                mobile
                initialEmail={initialAuth?.email || null}
                initialFullName={initialAuth?.fullName || null}
                initialSlug={initialAuth?.slug || null}
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
