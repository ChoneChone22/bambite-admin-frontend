"use client";

import { useEffect, useState } from "react";
import api from "@/src/services/api";

// Helper function to format permission code (replace underscores with spaces and capitalize)
const formatPermissionCode = (code: string): string => {
  if (!code) return "Unnamed Permission";
  return code
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

interface StaffProfileResponse {
  id: string;
  email: string;
  isActive?: boolean;
  mustChangePassword?: boolean;
  staff?: {
    id: string;
    employeeId?: string;
    name?: string;
    position: string;
    status?: "active" | "on_leave" | "quit";
    department?: {
      id: string;
      name: string;
      shortName: string;
    };
  };
  permissions?: {
    id: string;
    code: string;
  }[];
}

export default function StaffProfilePage() {
  const [profile, setProfile] = useState<StaffProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Use API service method for consistency
        const data = await api.staffAccounts.getProfile();
        // Map StaffAccount to StaffProfileResponse format
        setProfile({
          id: data.id,
          email: data.email,
          isActive: data.isActive,
          mustChangePassword: data.mustChangePassword,
          staff: data.staff,
          permissions: data.permissions,
        } as StaffProfileResponse);
      } catch (err: any) {
        console.error("Failed to fetch staff profile:", err);
        
        // Handle 403 Forbidden - this should not happen for own profile
        if (err?.statusCode === 403 || err?.response?.status === 403) {
          setError(
            "Access denied. You should be able to view your own profile. " +
            "This may be a backend permission configuration issue. " +
            "Please contact your administrator."
          );
        } else {
          setError(err?.message || "Failed to load staff profile");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[--primary]"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1" style={{ color: "#000000" }}>
            My Profile
          </h1>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-red-600 text-sm">{error || "Profile not found."}</p>
        </div>
      </div>
    );
  }

  const staff = profile.staff;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1" style={{ color: "#000000" }}>
          My Profile
        </h1>
        <p className="text-sm text-gray-600">
          View-only profile for your staff account
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <SectionHeading title="Account" />
          <ProfileRow label="Email" value={profile.email} />

          <SectionHeading title="Staff Information" />
          <ProfileRow
            label="Employee ID"
            value={staff?.employeeId || "—"}
          />
          <ProfileRow label="Name" value={staff?.name || "—"} />
          <ProfileRow label="Position" value={staff?.position || "—"} />
          <ProfileRow
            label="Department"
            value={
              staff?.department
                ? `${staff.department.name} (${staff.department.shortName})`
                : "—"
            }
          />
          <ProfileRow label="Status" value={staff?.status || "—"} />

          <SectionHeading title="Permissions" />
          {profile.permissions && profile.permissions.length > 0 ? (
            <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
              {profile.permissions.map((perm) => (
                <li key={perm.id}>
                  <span className="font-medium">
                    {formatPermissionCode(perm.code || "")}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-600">
              No explicit permissions assigned.
            </p>
          )}
        </div>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium" style={{ color: "#000000" }}>
        {value}
      </span>
    </div>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <h2 className="text-sm font-semibold mt-4 mb-1" style={{ color: "#000000" }}>
      {title}
    </h2>
  );
}


