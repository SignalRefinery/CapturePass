"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { UserMenu } from "@/components/auth/user-menu";

export function Shell({
  children,
  navLinks,
  footerLeft,
  footerRight,
  myProfileHref,
  initialAuth
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

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
              {navLinks?.map((link) => (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}

              {profileHref && (
                <Link href={profileHref}>My profile</Link>
              )}
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
                {navLinks?.map((link) => (
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