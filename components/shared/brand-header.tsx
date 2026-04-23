import Link from "next/link";
import type { NavLink } from "@/lib/types";
import { SignalPassMark } from "@/components/shared/signal-pass-mark";
export function BrandHeader({ links }: { links: NavLink[] }) {
  return (
    <header className="topbar">
      <Link className="brand" href="/">
        <span className="brand-star"><SignalPassMark /></span>
        <span>Signal Pass</span>
      </Link>
      <nav className="nav" aria-label="Primary navigation">
        {links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
      </nav>
    </header>
  );
}
