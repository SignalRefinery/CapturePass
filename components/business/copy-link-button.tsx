"use client";

import { useState } from "react";

export function CopyLinkButton({
  value,
  className = "button secondary",
  label = "Copy link",
  copiedLabel = "Copied"
}: {
  value: string;
  className?: string;
  label?: string;
  copiedLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button className={className} type="button" onClick={copyLink}>
      {copied ? copiedLabel : label}
    </button>
  );
}
