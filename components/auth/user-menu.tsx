"use client";

import Link from "next/link";

export function UserMenu({
  mobile,
  initialEmail,
  initialFullName,
  initialSlug
}) {
  const isLoggedIn = !!initialEmail;

  if (!isLoggedIn) {
    return mobile ? (
      <div className="mobile-auth">
        <Link href="/login" className="button secondary">
          Sign in
        </Link>
        <Link href="/signup" className="button primary">
          Get started
        </Link>
      </div>
    ) : (
      <div className="auth-buttons">
        <Link href="/login">Sign in</Link>
        <Link href="/signup" className="button primary">
          Get started
        </Link>
      </div>
    );
  }

  return (
    <div className={mobile ? "user-popover-mobile" : "user-popover"}>
      <div className="user-meta">
        <div className="user-meta-label">Signed in as</div>
        <div className="user-meta-email">{initialEmail}</div>
      </div>

      <div className="user-links">
        <Link href="/dashboard" className="user-link">
          Dashboard
        </Link>
        <Link href="/account" className="user-link">
          Account
        </Link>
        <Link href="/admin" className="user-link">
          Admin
        </Link>

        <form action="/auth/signout" method="post">
  <button
    className="user-link user-link-button"
    type="submit"
  >
    Sign out
  </button>
</form>
      </div>
    </div>
  );
}