import { addEmployee } from "@/app/dashboard/business/actions";

export function BusinessAddEmployeeSection({ organizationId }: { organizationId: string }) {
  return (
    <section className="dashboard-wrap">
      <div className="dashboard-card">
        <div className="dashboard-kicker">Employees</div>
        <h2>Create employee profiles.</h2>
        <p className="editor-copy">
          Employees get an email invite to create their password and open their business pass page.
        </p>
        <form action={addEmployee} className="editor-form" style={{ marginTop: 18 }}>
          <input type="hidden" name="organization_id" value={organizationId} />
          <div className="editor-grid">
            <label className="editor-label">
              Name
              <input className="editor-input" name="name" required />
            </label>
            <label className="editor-label">
              Title
              <input className="editor-input" name="title" />
            </label>
          </div>
          <div className="editor-grid">
            <label className="editor-label">
              Email
              <input className="editor-input" name="email" type="email" />
            </label>
            <label className="editor-label">
              Phone
              <input className="editor-input" name="phone" type="tel" />
            </label>
          </div>
          <button className="button primary" type="submit">Add employee</button>
        </form>
      </div>
    </section>
  );
}
