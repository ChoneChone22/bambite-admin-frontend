"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/src/services/api";
import { Staff } from "@/src/types/api";
import { formatPrice } from "@/src/lib/utils";

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const staffId = params?.id as string;

  const [staff, setStaff] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStaff = async () => {
      if (!staffId) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.staff.getById(staffId);
        console.log("Staff detail response (raw):", JSON.stringify(data, null, 2));
        
        // Ensure we have valid staff data
        if (data && typeof data === "object") {
          // Parse numeric fields properly - handle string numbers and ensure correct types
          const rawSalary = typeof data.salary === "string" ? parseFloat(data.salary) : (data.salary || 0);
          const rawBonus = typeof data.totalBonus === "string" ? parseFloat(data.totalBonus) : (data.totalBonus || 0);
          
          // If salary is 0/missing but bonus has a value, the backend might have swapped them
          // Use the bonus value as salary if salary is 0
          const finalSalary = (rawSalary && rawSalary > 0) ? rawSalary : (rawBonus > 0 ? rawBonus : 0);
          const finalBonus = (rawSalary && rawSalary > 0 && rawBonus > 0 && rawBonus !== rawSalary) ? rawBonus : 0;
          
          const normalizedStaff: Staff = {
            ...data,
            salary: finalSalary,
            totalBonus: finalBonus,
            // Parse tax
            tax: typeof data.tax === "number" ? data.tax : (typeof data.tax === "string" ? parseFloat(data.tax) || 0 : 0),
          };
          
          console.log("Normalized staff:", normalizedStaff);
          setStaff(normalizedStaff);
        } else {
          throw new Error("Invalid staff data received");
        }
      } catch (err: any) {
        console.error("Failed to fetch staff detail:", err);
        setError(err?.message || "Failed to load staff details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaff();
  }, [staffId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[--primary]"></div>
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="max-w-3xl">
        <button
          className="mb-4 text-sm font-semibold cursor-pointer"
          style={{ color: "#2C5BBB", cursor: "pointer" }}
          onClick={() => router.push("/staff/dashboard/staff")}
        >
          ← Back to Staff List
        </button>
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg" style={{ color: "#b91c1c" }}>
          {error || "Staff member not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        className="text-sm font-semibold cursor-pointer"
        style={{ color: "#2C5BBB", cursor: "pointer" }}
        onClick={() => router.push("/staff/dashboard/staff")}
      >
        ← Back to Staff List
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "#000000" }}>
            {staff.name || staff.user?.email || "Staff Detail"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "#4b5563" }}>
            Employee ID: {staff.employeeId || "—"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6 space-y-3" style={{ backgroundColor: "#ffffff" }}>
          <h2 className="text-lg font-semibold mb-2" style={{ color: "#000000" }}>
            Basic Information
          </h2>
          <DetailRow label="Employee ID" value={staff.employeeId || "—"} />
          <DetailRow
            label="Name"
            value={staff.name || staff.user?.email || "—"}
          />
          <DetailRow
            label="Department"
            value={
              staff.department
                ? `${staff.department.name} (${staff.department.shortName})`
                : "—"
            }
          />
          <DetailRow label="Position" value={staff.position} />
          <DetailRow
            label="Status"
            value={staff.status || "—"}
            valueClassName={
              staff.status === "active"
                ? "text-green-600"
                : staff.status === "on_leave"
                ? "text-yellow-600"
                : "text-gray-600"
            }
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-3" style={{ backgroundColor: "#ffffff" }}>
          <h2 className="text-lg font-semibold mb-2" style={{ color: "#000000" }}>
            Compensation
          </h2>
          <DetailRow
            label="Base Salary"
            value={
              typeof staff.salary === "number" && !isNaN(staff.salary)
                ? formatPrice(staff.salary)
                : "$0.00"
            }
          />
          <DetailRow
            label="Bonus"
            value={formatPrice(staff.totalBonus || 0)}
          />
          <DetailRow label="Tax" value={formatPrice(staff.tax || 0)} />
          <DetailRow
            label="Net Pay (latest)"
            value={
              typeof staff.netPay === "number"
                ? formatPrice(staff.netPay)
                : "Calculated per payment"
            }
          />
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string | number;
  valueClassName?: string;
}) {
  // Determine value color based on valueClassName or default
  const getValueColor = () => {
    if (valueClassName?.includes("green")) return "#16a34a";
    if (valueClassName?.includes("yellow")) return "#ca8a04";
    if (valueClassName?.includes("gray")) return "#4b5563";
    return "#000000"; // Default black
  };

  return (
    <div className="flex justify-between text-sm">
      <span style={{ color: "#4b5563" }}>{label}</span>
      <span className="font-medium" style={{ color: getValueColor() }}>{value}</span>
    </div>
  );
}


