import Link from "next/link";
import { BusinessBrandThemeFields } from "@/components/business/business-brand-theme-fields";
import { ConfirmSubmitButton } from "@/components/shared/confirm-submit-button";
import { deleteBusinessLogo, updateOrganizationBranding } from "@/app/dashboard/business/actions";
import { BUSINESS_LOGO_MAX_BYTES } from "@/lib/business/assets";
import type { OrganizationRecord } from "@/lib/types";

export function BusinessBrandingSection({ organization }: { organization: OrganizationRecord }) {
  return (
    <section className="dashboard-wrap" id="business-branding">
      <div className="dashboard-card">
        <div className="dashboard-kicker">Business branding</div>
        <h2>Customize pass pages.</h2>
        <p className="editor-copy">
          These colors, logo, and optional links apply to business token pages like /p/token.
        </p>
        <form action={updateOrganizationBranding} className="editor-form" encType="multipart/form-data" style={{ marginTop: 18 }}>
          <input type="hidden" name="organization_id" value={organization.id} />
          <BusinessBrandThemeFields organization={organization} />
          <div className="editor-label">
            Logo PNG
            {organization.brand_logo_url ? (
              <div className="business-logo-preview">
                {/* eslint-disable-next-line @next/next/no-img-element -- storage-backed customer logos are remote runtime uploads, not static assets. */}
                <img src={organization.brand_logo_url} alt={`${organization.name} logo`} />
                <span className="table-subtext">Current logo</span>
              </div>
            ) : (
              <span className="table-subtext">No logo uploaded.</span>
            )}
            <input
              className="editor-input"
              name="brand_logo_file"
              type="file"
              accept="image/png"
            />
            <span className="table-subtext">
              PNG only. Max {Math.round(BUSINESS_LOGO_MAX_BYTES / 1024 / 1024)} MB.
            </span>
          </div>
          <div>
            <div className="dashboard-kicker">Business web links</div>
            <p className="editor-copy">
              These replace the email/profile URL strip on every employee pass. Empty links stay hidden.
            </p>
          </div>
          {[1, 2, 3, 4].map((index) => {
            const titleKey = `business_link_${index}_title` as keyof OrganizationRecord;
            const urlKey = `business_link_${index}_url` as keyof OrganizationRecord;
            return (
              <div className="editor-grid" key={index}>
                <label className="editor-label">
                  Link {index} label
                  <input
                    className="editor-input"
                    name={`business_link_${index}_title`}
                    placeholder={index === 1 ? "Company website" : "Book a demo"}
                    defaultValue={(organization[titleKey] as string | null) || ""}
                  />
                </label>
                <label className="editor-label">
                  Link {index} URL
                  <input
                    className="editor-input"
                    name={`business_link_${index}_url`}
                    type="url"
                    placeholder="https://..."
                    defaultValue={(organization[urlKey] as string | null) || ""}
                  />
                </label>
              </div>
            );
          })}
          <button className="button primary" type="submit">Save branding</button>
        </form>
        {organization.brand_logo_url ? (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
            <Link className="button secondary" href={`/api/business/logo/download?organization_id=${organization.id}`}>
              Download logo
            </Link>
            <form action={deleteBusinessLogo}>
              <input type="hidden" name="organization_id" value={organization.id} />
              <ConfirmSubmitButton
                className="button secondary"
                confirmMessage="Delete this business logo?"
              >
                Delete logo
              </ConfirmSubmitButton>
            </form>
          </div>
        ) : null}
      </div>
    </section>
  );
}
