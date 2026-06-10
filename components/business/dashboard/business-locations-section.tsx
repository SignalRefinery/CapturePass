import { ConfirmSubmitButton } from "@/components/shared/confirm-submit-button";
import {
  deleteBusinessLocation,
  saveBusinessLocation
} from "@/app/dashboard/business/actions";
import type {
  BusinessLocationRecord,
  OrganizationMemberRecord,
  OrganizationRecord
} from "@/lib/types";

type BusinessLocationsSectionProps = {
  organization: OrganizationRecord;
  locations: BusinessLocationRecord[];
  members: OrganizationMemberRecord[];
};

export function BusinessLocationsSection({
  organization,
  locations,
  members
}: BusinessLocationsSectionProps) {
  return (
    <section className="dashboard-wrap" id="business-locations">
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-kicker">Locations</div>
          <h2>Keep every office, rooftop, or market location organized.</h2>
          <p className="editor-copy">
            Locations are optional at first, so businesses with no offices continue to work exactly as they do today.
          </p>

          <form action={saveBusinessLocation} className="editor-form" style={{ marginTop: 18 }}>
            <input type="hidden" name="organization_id" value={organization.id} />
            <label className="editor-label">
              Location name
              <input className="editor-input" name="name" placeholder="Springfield Office" required />
            </label>
            <div className="editor-grid">
              <label className="editor-label">
                Slug
                <input className="editor-input" name="slug" placeholder="springfield-office" />
              </label>
              <label className="editor-label">
                Phone
                <input className="editor-input" name="phone" placeholder="(555) 555-5555" />
              </label>
            </div>
            <div className="editor-grid">
              <label className="editor-label">
                Address
                <input className="editor-input" name="address" placeholder="123 Main St" />
              </label>
              <label className="editor-label">
                City
                <input className="editor-input" name="city" placeholder="Springfield" />
              </label>
            </div>
            <div className="editor-grid">
              <label className="editor-label">
                State
                <input className="editor-input" name="state" placeholder="IL" maxLength={2} />
              </label>
            </div>
            <button className="button primary" type="submit">
              Create location
            </button>
          </form>

          <div className="admin-table-frame business-member-table" style={{ marginTop: 18 }}>
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Employees</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((location) => {
                    const assignedEmployees = members.filter((member) => member.location_id === location.id && member.status === "active");
                    return (
                      <tr key={location.id}>
                        <td>
                          <strong>{location.name}</strong>
                          <div className="table-subtext">
                            {[location.address, location.city, location.state].filter(Boolean).join(", ") || "No address yet"}
                          </div>
                        </td>
                        <td>{assignedEmployees.length}</td>
                        <td>
                          <details className="employee-manage-panel">
                            <summary className="button secondary">Edit</summary>
                            <div className="employee-manage-panel-inner">
                              <form action={saveBusinessLocation} className="editor-form">
                                <input type="hidden" name="organization_id" value={organization.id} />
                                <input type="hidden" name="location_id" value={location.id} />
                                <input type="hidden" name="region_id" value={location.region_id || ""} />
                                <label className="editor-label">
                                  Location name
                                  <input className="editor-input" name="name" defaultValue={location.name} required />
                                </label>
                                <div className="editor-grid">
                                  <label className="editor-label">
                                    Slug
                                    <input className="editor-input" name="slug" defaultValue={location.slug || ""} />
                                  </label>
                                  <label className="editor-label">
                                    Phone
                                    <input className="editor-input" name="phone" defaultValue={location.phone || ""} />
                                  </label>
                                </div>
                                <div className="editor-grid">
                                  <label className="editor-label">
                                    Address
                                    <input className="editor-input" name="address" defaultValue={location.address || ""} />
                                  </label>
                                  <label className="editor-label">
                                    City
                                    <input className="editor-input" name="city" defaultValue={location.city || ""} />
                                  </label>
                                </div>
                                <div className="editor-grid">
                                  <label className="editor-label">
                                    State
                                    <input className="editor-input" name="state" defaultValue={location.state || ""} maxLength={2} />
                                  </label>
                                </div>
                                <button className="button secondary" type="submit">
                                  Save location
                                </button>
                              </form>
                              <form action={deleteBusinessLocation}>
                                <input type="hidden" name="organization_id" value={organization.id} />
                                <input type="hidden" name="location_id" value={location.id} />
                                <ConfirmSubmitButton
                                  className="button secondary"
                                  confirmMessage={`Delete ${location.name}? Employees assigned to it will revert to no location.`}
                                >
                                  Delete location
                                </ConfirmSubmitButton>
                              </form>
                            </div>
                          </details>
                        </td>
                      </tr>
                    );
                  })}
                  {locations.length === 0 ? (
                    <tr>
                      <td colSpan={3}>
                        <p className="editor-copy">No locations yet. Add one above when you are ready.</p>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
