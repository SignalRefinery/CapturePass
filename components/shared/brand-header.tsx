import Link from "next/link";
import type { NavLink } from "@/lib/types";
import { TapTaggMark } from "@/components/shared/taptagg-mark";
export function BrandHeader({ links }: { links: NavLink[] }) {
  return (
    <header className="topbar">
      <Link className="brand" href="/">
        <span className="brand-star"><TapTaggMark /></span>
        <span>TapTagg</span>
      </Link>
      <nav className="nav" aria-label="Primary navigation">
        {links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
      </nav>
    </header>
  );
}
