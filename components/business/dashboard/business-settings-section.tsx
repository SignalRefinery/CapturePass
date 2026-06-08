import { BUSINESS_TYPE_DESCRIPTIONS, BUSINESS_TYPE_LABELS, BUSINESS_TYPES, normalizeBusinessType } from "@/lib/business-types";
import type { OrganizationRecord } from "@/lib/types";
import { updateOrganizationBusinessType } from "@/app/dashboard/business/actions";

export function BusinessSettingsSection({ organization }: { organization: OrganizationRecord }) {
  const businessType = normalizeBusinessType(organization.business_type);

  return (
    <section className="dashboard-wrap" id="business-settings">
      <div className="dashboard-card">
        <div className="dashboard-kicker">Business settings</div>
        <h2>Choose the business type.</h2>
        <p className="editor-copy">
          This is a broad category for future vertical-specific features. It does not change any profile, lead form, or analytics behavior yet.
        </p>
        <form action={updateOrganizationBusinessType} className="editor-form" style={{ marginTop: 18 }}>
          <input type="hidden" name="organization_id" value={organization.id} />
          <label className="editor-label">
            Business type
            <select className="editor-input" name="business_type" defaultValue={businessType}>
              {BUSINESS_TYPES.map((type) => (
                <option key={type} value={type}>
                  {BUSINESS_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </label>
          <p className="table-subtext">{BUSINESS_TYPE_DESCRIPTIONS[businessType]}</p>
          <button className="button primary" type="submit">
            Save business type
          </button>
        </form>
      </div>
    </section>
  );
}
