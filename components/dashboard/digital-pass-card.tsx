"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type PassViewOption = {
  id: string;
  label: string;
  url: string;
  passUrl: string;
};

export function DigitalPassCard({
  name,
  roleLine,
  organizationName,
  defaultViewId,
  views,
  selectedViewId: initialSelectedViewId
}: {
  name: string;
  roleLine: string;
  organizationName?: string | null;
  defaultViewId: string;
  views: PassViewOption[];
  selectedViewId?: string;
}) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const selectedView =
    views.find((view) => view.id === (initialSelectedViewId || defaultViewId)) || views[0];
  const qrUrl = useMemo(
    () =>
      `https://api.qrserver.com/v1/create-qr-code/?size=640x640&data=${encodeURIComponent(
        selectedView.url
      )}`,
    [selectedView.url]
  );
  const readableUrl = selectedView.url.replace(/^https?:\/\//, "");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(selectedView.url);
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 2200);
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <section className="pass-wrap">
      <div className="pass-card">
        <div className="pass-kicker">Digital pass</div>
        {views.length > 1 ? (
          <div className="pass-selected-view">
            <span>Pass view</span>
            <strong>{selectedView.label}</strong>
          </div>
        ) : null}

        <div className="pass-qr-frame">
          <img src={qrUrl} alt={`QR code for ${selectedView.label}`} />
        </div>

        <div className="pass-heading">
          <h2>{name}</h2>
          {roleLine ? <p>{roleLine}</p> : null}
          {organizationName ? <span>{organizationName}</span> : null}
        </div>

        <div className="pass-url">{readableUrl}</div>

        <div className="pass-actions">
          <button className="button primary" type="button" onClick={copyLink}>
            {copyStatus === "copied" ? "Copied" : "Copy link"}
          </button>
          <a className="button secondary" href={selectedView.url} target="_blank" rel="noreferrer">
            Open public profile
          </a>
        </div>
        {copyStatus === "error" ? (
          <p className="pass-error">Unable to copy the link. You can still open the profile above.</p>
        ) : null}
      </div>

      <div className="pass-instructions">
        <div>
          <div className="dashboard-kicker">iPhone</div>
          <p>Open this page in Safari, tap Share, then choose Add to Home Screen.</p>
        </div>
        <div>
          <div className="dashboard-kicker">Android</div>
          <p>Open this page in Chrome, tap the menu, then choose Add to Home screen or Install app.</p>
        </div>
      </div>

      {views.length > 1 ? (
        <div className="pass-view-grid">
          {views.map((view) => (
            <div
              className={view.id === selectedView.id ? "pass-view-card is-active" : "pass-view-card"}
              key={view.id}
            >
              <div>
                <span>{view.id === defaultViewId ? "Default pass" : "Profile view"}</span>
                <strong>{view.label}</strong>
              </div>
              <Link href={view.passUrl} className="button secondary">
                Open this pass
              </Link>
              <p>Open this page, then save it to your phone home screen for a dedicated QR icon.</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
