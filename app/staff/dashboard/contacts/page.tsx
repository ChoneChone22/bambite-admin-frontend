/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Staff Contact Management Page
 * View and manage contact form submissions (requires contact_management permission)
 */

"use client";

import { useEffect, useState } from "react";
import api from "@/src/services/api";
import { Contact, ContactReason } from "@/src/types/api";
import { formatDateTime, getErrorMessage } from "@/src/lib/utils";
import { useModal } from "@/src/hooks/useModal";

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
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg || "Failed to fetch contacts");
      console.error("Failed to fetch contacts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [reasonFilter, emailSearch]);

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
        const contactFromList = contacts.find((c) => c.id === id);
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[--primary]"></div>
      </div>
    );
  }

  return (
    <div>
      {modal.ModalComponent}
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold" style={{ color: "#000000" }}>
          Contact Management
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg mb-6" style={{ color: "#b91c1c" }}>
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
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Message Preview
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className="text-sm font-medium"
                      style={{ color: "#000000" }}
                    >
                      {contact.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm" style={{ color: "#000000" }}>
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
                      className="text-sm truncate max-w-xs"
                      style={{ color: "#6b7280" }}
                    >
                      {contact.message || "No message"}
                    </div>
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm"
                    style={{ color: "#6b7280" }}
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
              {contacts.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center"
                    style={{ color: "#6b7280" }}
                  >
                    No contacts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contact Detail Modal */}
      {selectedContact && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.3)", backdropFilter: "blur(2px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedContact(null);
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2
                  className="text-2xl font-bold"
                  style={{ color: "#000000" }}
                >
                  Contact Details
                </h2>
                <button
                  onClick={() => setSelectedContact(null)}
                  style={{ color: "#6b7280" }}
                  className="hover:text-gray-900 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#374151" }}
                  >
                    Name
                  </label>
                  <p className="text-sm" style={{ color: "#000000" }}>
                    {selectedContact?.name || "N/A"}
                  </p>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#374151" }}
                  >
                    Email
                  </label>
                  <p className="text-sm" style={{ color: "#000000" }}>
                    {selectedContact?.email || "N/A"}
                  </p>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#374151" }}
                  >
                    Reason
                  </label>
                  <p className="text-sm" style={{ color: "#000000" }}>
                    {selectedContact?.reason
                      ? CONTACT_REASONS.find((r) => r.value === selectedContact.reason)
                          ?.label || selectedContact.reason
                      : "N/A"}
                  </p>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#374151" }}
                  >
                    Message
                  </label>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: "#000000" }}>
                    {selectedContact?.message || "No message"}
                  </p>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#374151" }}
                  >
                    Submitted At
                  </label>
                  <p className="text-sm" style={{ color: "#6b7280" }}>
                    {selectedContact?.createdAt
                      ? formatDateTime(selectedContact.createdAt)
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => setSelectedContact(null)}
                  className="btn-secondary flex-1"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleDelete(selectedContact.id);
                    setSelectedContact(null);
                  }}
                  className="btn-primary flex-1"
                  style={{ backgroundColor: "#DC2626" }}
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
