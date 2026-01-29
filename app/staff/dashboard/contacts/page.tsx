/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Staff Contact Management Page
 * View and manage contact form submissions (requires contact_management permission)
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import api from "@/src/services/api";
import { Contact, ContactReason } from "@/src/types/api";
import { formatDateTime, getErrorMessage } from "@/src/lib/utils";
import { useModal } from "@/src/hooks/useModal";
import { useTablePagination } from "@/src/hooks";
import TablePagination from "@/src/components/TablePagination";
import LoadingSpinner from "@/src/components/LoadingSpinner";

const CONTACT_REASONS: { value: ContactReason; label: string }[] = [
  { value: "general_inquiry", label: "General Inquiry" },
  { value: "product_question", label: "Product Question" },
  { value: "collaboration", label: "Collaboration" },
  { value: "feedback", label: "Feedback" },
  { value: "other", label: "Other" },
];

export default function ContactsManagementPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reasonFilter, setReasonFilter] = useState<ContactReason | "all">("all");
  const [emailSearch, setEmailSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const modal = useModal();

  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const filters: any = {};
      if (reasonFilter !== "all") {
        filters.reason = reasonFilter;
      }
      if (emailSearch.trim()) {
        filters.email = emailSearch.trim();
      }
      const response = await api.contacts.getAll(filters);
      setContacts(response);
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      console.error("Failed to fetch contacts:", {
        error: errorMsg,
        status: err?.response?.status,
        data: err?.response?.data,
        filters: { reasonFilter, emailSearch },
      });
      setError(errorMsg || "Failed to fetch contacts. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [reasonFilter, emailSearch]);

  // Filter contacts based on reason and email search
  const filteredContacts = useMemo(() => {
    let filtered = contacts;
    
    if (reasonFilter !== "all") {
      filtered = filtered.filter((contact) => contact.reason === reasonFilter);
    }
    
    if (emailSearch.trim()) {
      const query = emailSearch.toLowerCase().trim();
      filtered = filtered.filter((contact) => {
        const email = contact.email?.toLowerCase() || "";
        const name = contact.name?.toLowerCase() || "";
        return email.includes(query) || name.includes(query);
      });
    }
    
    return filtered;
  }, [contacts, reasonFilter, emailSearch]);

  // Table pagination
  const {
    paginatedData,
    currentPage,
    totalPages,
    rowsPerPage,
    totalRows,
    handlePageChange,
    handleRowsPerPageChange,
  } = useTablePagination(filteredContacts, {
    initialRowsPerPage: 10,
    minRowsPerPage: 10,
    maxRowsPerPage: 50,
  });

  const handleDelete = async (id: string) => {
    const confirmed = await modal.confirm(
      "Are you sure you want to delete this contact submission? This action cannot be undone.",
      "Delete Contact"
    );
    if (!confirmed) return;

    try {
      await api.contacts.delete(id);
      await fetchContacts();
      await modal.alert("Contact deleted successfully", "Success", "success");
    } catch (err: any) {
      await modal.alert(
        getErrorMessage(err) || "Failed to delete contact",
        "Error",
        "error"
      );
      console.error("Failed to delete contact:", err);
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const contact = await api.contacts.getById(id);
      if (contact && contact.id) {
        setSelectedContact(contact);
      } else {
        const contactFromList = filteredContacts.find((c) => c.id === id);
        if (contactFromList) {
          setSelectedContact(contactFromList);
        } else {
          await modal.alert(
            "Contact data not found",
            "Error",
            "error"
          );
        }
      }
    } catch (err: any) {
      const contactFromList = contacts.find((c) => c.id === id);
      if (contactFromList) {
        setSelectedContact(contactFromList);
      } else {
        await modal.alert(
          getErrorMessage(err) || "Failed to load contact details",
          "Error",
          "error"
        );
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div>
      {modal.ModalComponent}
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Contact Management
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg mb-6 text-foreground">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search by email..."
            value={emailSearch}
            onChange={(e) => setEmailSearch(e.target.value)}
            className="input-field w-full"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setReasonFilter("all")}
            className="px-4 py-2 rounded transition-colors"
            style={
              reasonFilter === "all"
                ? { backgroundColor: "#2C5BBB", color: "#ffffff", cursor: "pointer" }
                : { backgroundColor: "#e5e7eb", color: "#374151", cursor: "pointer" }
            }
            onMouseEnter={(e) => {
              if (reasonFilter !== "all") {
                e.currentTarget.style.backgroundColor = "#d1d5db";
              }
            }}
            onMouseLeave={(e) => {
              if (reasonFilter !== "all") {
                e.currentTarget.style.backgroundColor = "#e5e7eb";
              }
            }}
          >
            All
          </button>
          {CONTACT_REASONS.map((reason) => (
            <button
              key={reason.value}
              onClick={() => setReasonFilter(reason.value)}
              className="px-4 py-2 rounded transition-colors"
              style={
                reasonFilter === reason.value
                  ? { backgroundColor: "#2C5BBB", color: "#ffffff", cursor: "pointer" }
                  : { backgroundColor: "#e5e7eb", color: "#374151", cursor: "pointer" }
              }
              onMouseEnter={(e) => {
                if (reasonFilter !== reason.value) {
                  e.currentTarget.style.backgroundColor = "#d1d5db";
                }
              }}
              onMouseLeave={(e) => {
                if (reasonFilter !== reason.value) {
                  e.currentTarget.style.backgroundColor = "#e5e7eb";
                }
              }}
            >
              {reason.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-card rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-background">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Message Preview
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-gray-200">
              {paginatedData.map((contact) => (
                <tr key={contact.id} className="hover:bg-background">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className="text-sm font-medium"
                    >
                      {contact.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">
                      {contact.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                      {CONTACT_REASONS.find((r) => r.value === contact.reason)?.label ||
                        contact.reason}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div
                      className="text-sm truncate max-w-xs text-foreground"
                    >
                      {contact.message || "No message"}
                    </div>
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm text-foreground"
                  >
                    {contact.createdAt
                      ? formatDateTime(contact.createdAt)
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button
                      onClick={() => handleViewDetails(contact.id)}
                      className="font-semibold hover:underline cursor-pointer"
                      style={{ color: "#2C5BBB", cursor: "pointer" }}
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="font-semibold hover:underline cursor-pointer"
                      style={{ color: "#DC2626", cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filteredContacts.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-foreground"
                  >
                    No contacts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredContacts.length > 0 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          rowsPerPage={rowsPerPage}
          totalRows={totalRows}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          minRowsPerPage={10}
          maxRowsPerPage={50}
        />
      )}

      {/* Contact Detail Modal */}
      {selectedContact && (
        <div
          className="no-glass fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "none",
            WebkitBackdropFilter: "none",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedContact(null);
            }
          }}
        >
          <div
            className="rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border"
            style={{
              backgroundColor: "hsl(var(--card))",
              backdropFilter: "none",
              WebkitBackdropFilter: "none",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2
                  className="text-2xl font-bold"
                >
                  Contact Details
                </h2>
                <button
                  onClick={() => setSelectedContact(null)}
                  className="text-foreground hover:text-foreground transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1 text-foreground"
                  >
                    Name
                  </label>
                  <p className="text-sm text-foreground">
                    {selectedContact?.name || "N/A"}
                  </p>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1 text-foreground"
                  >
                    Email
                  </label>
                  <p className="text-sm text-foreground">
                    {selectedContact?.email || "N/A"}
                  </p>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1 text-foreground"
                  >
                    Reason
                  </label>
                  <p className="text-sm text-foreground">
                    {selectedContact?.reason
                      ? CONTACT_REASONS.find((r) => r.value === selectedContact.reason)
                          ?.label || selectedContact.reason
                      : "N/A"}
                  </p>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1 text-foreground"
                  >
                    Message
                  </label>
                  <p className="text-sm whitespace-pre-wrap text-foreground">
                    {selectedContact?.message || "No message"}
                  </p>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1 text-foreground"
                  >
                    Submitted At
                  </label>
                  <p className="text-sm text-foreground">
                    {selectedContact?.createdAt
                      ? formatDateTime(selectedContact.createdAt)
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => setSelectedContact(null)}
                  className="btn-secondary flex-1 cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleDelete(selectedContact.id);
                    setSelectedContact(null);
                  }}
                  className="btn-destructive flex-1 cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
