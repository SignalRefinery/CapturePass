import "./globals.css";
import type { Metadata } from "next";
import { SessionSync } from "@/components/shared/session-sync";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    siteName: SITE_NAME,
    type: "website"
  },
  icons: {
    icon: "/icon",
    shortcut: "/icon",
    apple: "/apple-icon"
  },
  twitter: {
    card: "summary_large_image"
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionSync />
        {children}
      </body>
    </html>
  );
}
