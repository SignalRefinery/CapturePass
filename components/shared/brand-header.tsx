import Link from "next/link";
import type { NavLink } from "@/lib/types";
import { CapturePassBrandArt } from "@/components/shared/capturepass-brand-art";
export function BrandHeader({ links }: { links: NavLink[] }) {
  return (
    <header className="topbar">
      <Link className="brand" href="/">
        <CapturePassBrandArt className="brand-logo brand-logo-lockup" variant="logoLockup" />
      </Link>
      <nav className="nav" aria-label="Primary navigation">
        {links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
      </nav>
    </header>
  );
}
