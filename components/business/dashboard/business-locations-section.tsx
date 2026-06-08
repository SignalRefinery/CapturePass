import { ConfirmSubmitButton } from "@/components/shared/confirm-submit-button";
import {
  deleteBusinessLocation,
  saveBusinessLocation,
  saveBusinessRegion
} from "@/app/dashboard/business/actions";
import type {
  BusinessLocationRecord,
  BusinessRegionRecord,
  OrganizationMemberRecord,
  OrganizationRecord
} from "@/lib/types";

type BusinessLocationsSectionProps = {
  organization: OrganizationRecord;
  locations: BusinessLocationRecord[];
  regions: BusinessRegionRecord[];
  members: OrganizationMemberRecord[];
};

export function BusinessLocationsSection({
  organization,
  locations,
  regions,
  members
}: BusinessLocationsSectionProps) {
  const regionById = new Map(regions.map((region) => [region.id, region]));

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
              <label className="editor-label">
                Region
                <select className="editor-input" name="region_id" defaultValue="">
                  <option value="">No region</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
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
                    <th>Region</th>
                    <th>Employees</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((location) => {
                    const region = location.region_id ? regionById.get(location.region_id) : null;
                    const assignedEmployees = members.filter((member) => member.location_id === location.id && member.status === "active");
                    return (
                      <tr key={location.id}>
                        <td>
                          <strong>{location.name}</strong>
                          <div className="table-subtext">
                            {[location.address, location.city, location.state].filter(Boolean).join(", ") || "No address yet"}
                          </div>
                        </td>
                        <td>{region?.name || "No region"}</td>
                        <td>{assignedEmployees.length}</td>
                        <td>
                          <details className="employee-manage-panel">
                            <summary className="button secondary">Edit</summary>
                            <div className="employee-manage-panel-inner">
                              <form action={saveBusinessLocation} className="editor-form">
                                <input type="hidden" name="organization_id" value={organization.id} />
                                <input type="hidden" name="location_id" value={location.id} />
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
                                  <label className="editor-label">
                                    Region
                                    <select className="editor-input" name="region_id" defaultValue={location.region_id || ""}>
                                      <option value="">No region</option>
                                      {regions.map((region) => (
                                        <option key={region.id} value={region.id}>
                                          {region.name}
                                        </option>
                                      ))}
                                    </select>
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
                      <td colSpan={4}>
                        <p className="editor-copy">No locations yet. Add one above when you are ready.</p>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-kicker">Regions</div>
          <h2>Future-ready territory groups.</h2>
          <p className="editor-copy">
            Regions are intentionally simple for now. They let locations be grouped later by state codes or custom territory rules.
          </p>

          <form action={saveBusinessRegion} className="editor-form" style={{ marginTop: 18 }}>
            <input type="hidden" name="organization_id" value={organization.id} />
            <label className="editor-label">
              Region name
              <input className="editor-input" name="name" placeholder="Central Illinois" required />
            </label>
            <label className="editor-label">
              Description
              <textarea className="editor-input" name="description" rows={3} placeholder="Optional notes about the territory." />
            </label>
            <label className="editor-label">
              State codes
              <input className="editor-input" name="state_codes" placeholder="IL,MO,IN" />
            </label>
            <button className="button primary" type="submit">
              Create region
            </button>
          </form>

          <div className="admin-table-frame business-member-table" style={{ marginTop: 18 }}>
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Region</th>
                    <th>State codes</th>
                    <th>Locations</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {regions.map((region) => {
                    const regionLocations = locations.filter((location) => location.region_id === region.id);
                    return (
                      <tr key={region.id}>
                        <td>
                          <strong>{region.name}</strong>
                          {region.description ? <div className="table-subtext">{region.description}</div> : null}
                        </td>
                        <td>{region.state_codes?.length ? region.state_codes.join(", ") : "—"}</td>
                        <td>{regionLocations.length}</td>
                        <td>
                          <details className="employee-manage-panel">
                            <summary className="button secondary">Edit</summary>
                            <div className="employee-manage-panel-inner">
                              <form action={saveBusinessRegion} className="editor-form">
                                <input type="hidden" name="organization_id" value={organization.id} />
                                <input type="hidden" name="region_id" value={region.id} />
                                <label className="editor-label">
                                  Region name
                                  <input className="editor-input" name="name" defaultValue={region.name} required />
                                </label>
                                <label className="editor-label">
                                  Description
                                  <textarea className="editor-input" name="description" rows={3} defaultValue={region.description || ""} />
                                </label>
                                <label className="editor-label">
                                  State codes
                                  <input
                                    className="editor-input"
                                    name="state_codes"
                                    defaultValue={region.state_codes?.join(", ") || ""}
                                  />
                                </label>
                                <button className="button secondary" type="submit">
                                  Save region
                                </button>
                              </form>
                            </div>
                          </details>
                        </td>
                      </tr>
                    );
                  })}
                  {regions.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <p className="editor-copy">No regions yet. Add one when you want to group locations by territory.</p>
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
