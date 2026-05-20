"use client";

import { useMemo, useState } from "react";

type PassViewOption = {
  id: string;
  label: string;
  url: string;
};

export function DigitalPassCard({
  name,
  roleLine,
  organizationName,
  defaultViewId,
  views
}: {
  name: string;
  roleLine: string;
  organizationName?: string | null;
  defaultViewId: string;
  views: PassViewOption[];
}) {
  const [selectedViewId, setSelectedViewId] = useState(defaultViewId);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const selectedView = views.find((view) => view.id === selectedViewId) || views[0];
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
        <div className="pass-kicker">Signal Pass</div>
        <div className="pass-heading">
          <h2>{name}</h2>
          {roleLine ? <p>{roleLine}</p> : null}
          {organizationName ? <span>{organizationName}</span> : null}
        </div>

        {views.length > 1 ? (
          <label className="pass-view-select">
            QR destination
            <select value={selectedViewId} onChange={(event) => setSelectedViewId(event.target.value)}>
              {views.map((view) => (
                <option key={view.id} value={view.id}>
                  {view.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="pass-qr-frame">
          <img src={qrUrl} alt={`QR code for ${selectedView.label}`} />
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
    </section>
  );
}
