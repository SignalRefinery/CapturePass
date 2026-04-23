import Link from 'next/link';
import { Shell } from '@/components/shared/shell';
export default function NotFound() { return <Shell footerLeft="Page not found" footerRight="Signal Pass"><section className="simple-hero"><div className="kicker"><span className="mini-star">✦</span><span>Not found</span></div><h1>That page is not available.</h1><p>The profile or page you are looking for could not be found.</p><div className="cta-row"><Link className="button secondary" href="/">Return home</Link></div></section></Shell>; }
