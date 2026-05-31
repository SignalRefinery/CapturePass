"use client";

import { useMemo, useState } from "react";
import type { ContactSubmissionRecord, OrganizationMemberRecord } from "@/lib/types";

type ContactTableProps = {
  contacts: ContactSubmissionRecord[];
  members?: Pick<OrganizationMemberRecord, "id" | "name">[];
  showMemberFilter?: boolean;
};

function escapeCsv(value?: string | null) {
  const text = value || "";
  return `"${text.replace(/"/g, '""')}"`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function downloadCsv(rows: ContactSubmissionRecord[]) {
  const header = ["Name", "Company", "Title", "Email", "Phone", "Note", "Source", "Date Shared"];
  const body = rows.map((row) => [
    row.name,
    row.company,
    row.title,
    row.email,
    row.phone,
    row.note,
    row.source,
    row.created_at
  ]);
  const csv = [header, ...body]
    .map((row) => row.map((cell) => escapeCsv(cell)).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `taptagg-contacts-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function ContactTable({ contacts, members = [], showMemberFilter = false }: ContactTableProps) {
  const [memberId, setMemberId] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      if (memberId && contact.profile_id !== memberId && contact.submitted_to_user_id !== memberId) {
        return false;
      }

      if (dateFilter && contact.created_at) {
        return contact.created_at.slice(0, 10) === dateFilter;
      }

      return true;
    });
  }, [contacts, dateFilter, memberId]);

  if (!contacts.length) {
    return (
      <div className="dashboard-card">
        <div className="dashboard-kicker">Contacts</div>
        <h2>No contacts yet.</h2>
        <p className="editor-copy">
          When someone taps Share My Contact on your public profile, their details will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard-card">
      <div className="dashboard-kicker">Contacts</div>
      <h2>Shared contacts.</h2>
      <p className="editor-copy">Review contact details shared through your TapTagg profile.</p>

      <div className="contact-toolbar">
        {showMemberFilter ? (
          <label className="editor-label">
            Team member
            <select className="editor-input" value={memberId} onChange={(event) => setMemberId(event.target.value)}>
              <option value="">All team members</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="editor-label">
          Date
          <input
            className="editor-input"
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
          />
        </label>

        <button className="button secondary" type="button" onClick={() => downloadCsv(filteredContacts)}>
          Export CSV
        </button>
      </div>

      <div className="admin-table-frame business-member-table">
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Note</th>
                <th>Source</th>
                <th>Date Shared</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact) => (
                <tr key={contact.id}>
                  <td>
                    <strong>{contact.name}</strong>
                    {contact.title ? <div className="table-subtext">{contact.title}</div> : null}
                  </td>
                  <td>{contact.company || "—"}</td>
                  <td>{contact.email || "—"}</td>
                  <td>{contact.phone || "—"}</td>
                  <td>{contact.note || "—"}</td>
                  <td>{contact.source || "—"}</td>
                  <td>{formatDate(contact.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!filteredContacts.length ? (
        <p className="editor-copy" style={{ marginTop: 16 }}>
          No contacts match the current filters.
        </p>
      ) : null}
    </div>
  );
}
