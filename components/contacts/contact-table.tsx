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

function escapeVcard(value?: string | null) {
  return (value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function cleanPhone(value?: string | null) {
  if (!value) return "";
  return value.replace(/[^0-9+]/g, "");
}

function safeFilename(value?: string | null) {
  const safeName = (value || "capturepass-contact")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return safeName || "capturepass-contact";
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadCsv(rows: ContactSubmissionRecord[]) {
  const header = [
    "Name",
    "Company",
    "Title",
    "Email",
    "Phone",
    "Note",
    "Source",
    "Date Shared",
    "Consent Granted",
    "Consent Given At",
    "Consent Language",
    "Source URL"
  ];
  const body = rows.map((row) => [
    row.name,
    row.company,
    row.title,
    row.email,
    row.phone,
    row.note,
    row.source,
    row.created_at,
    row.consent_to_contact ? "Yes" : "No",
    row.consent_given_at,
    row.consent_text,
    row.source_url
  ]);
  const csv = [header, ...body]
    .map((row) => row.map((cell) => escapeCsv(cell)).join(","))
    .join("\n");
  downloadBlob(csv, `capturepass-contacts-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8");
}

function contactToVcard(contact: ContactSubmissionRecord) {
  const noteParts = [
    contact.note,
    contact.source ? `Source: ${contact.source}` : "",
    contact.created_at ? `Date shared: ${formatDate(contact.created_at)}` : ""
  ].filter(Boolean);

  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVcard(contact.name)}`,
    contact.company ? `ORG:${escapeVcard(contact.company)}` : "",
    contact.title ? `TITLE:${escapeVcard(contact.title)}` : "",
    contact.email ? `EMAIL;TYPE=INTERNET:${escapeVcard(contact.email)}` : "",
    contact.phone ? `TEL;TYPE=CELL:${escapeVcard(cleanPhone(contact.phone))}` : "",
    noteParts.length ? `NOTE:${escapeVcard(noteParts.join("\n"))}` : "",
    "END:VCARD"
  ]
    .filter(Boolean)
    .join("\r\n");
}

function downloadVcard(contact: ContactSubmissionRecord) {
  downloadBlob(
    contactToVcard(contact),
    `${safeFilename(contact.name)}.vcf`,
    "text/x-vcard;charset=utf-8"
  );
}

function downloadVcards(rows: ContactSubmissionRecord[]) {
  const vcards = rows.map(contactToVcard).join("\r\n\r\n");
  downloadBlob(
    vcards,
    `capturepass-contacts-${new Date().toISOString().slice(0, 10)}.vcf`,
    "text/x-vcard;charset=utf-8"
  );
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
      <p className="editor-copy">Review contact details shared through your CapturePass profile.</p>

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
        <button className="button secondary" type="button" onClick={() => downloadVcards(filteredContacts)}>
          Export vCards
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
                <th>Consent</th>
                <th>vCard</th>
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
                  <td>
                    <strong>{contact.consent_to_contact ? "Yes" : "No"}</strong>
                    {contact.consent_given_at ? (
                      <div className="table-subtext">{formatDate(contact.consent_given_at)}</div>
                    ) : null}
                    {contact.consent_text ? <div className="table-subtext">{contact.consent_text}</div> : null}
                  </td>
                  <td>
                    <button className="button secondary" type="button" onClick={() => downloadVcard(contact)}>
                      Download
                    </button>
                  </td>
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
