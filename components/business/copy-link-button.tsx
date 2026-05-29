"use client";

import { useState } from "react";

export function CopyLinkButton({
  value,
  className = "button secondary"
}: {
  value: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button className={className} type="button" onClick={copyLink}>
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
