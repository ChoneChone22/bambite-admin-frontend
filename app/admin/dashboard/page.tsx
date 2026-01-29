/**
 * Admin Dashboard Home Page
 * Professional dashboard with shadcn/ui components and real-time data
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from "@/src/components/theme-toggle";
import { UserNav } from "@/src/components/user-nav";
import { NotificationsNav } from "@/src/components/notifications-nav";
import api from "@/src/services/api";
import { getErrorMessage } from "@/src/lib/utils";
import { useRealtime } from "@/src/hooks/useRealtime";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import { tokenManager } from "@/src/lib/tokenManager";
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  Activity,
  Filter,
  Plus,
  BarChart3,
  Boxes,
  Settings,
  UserPlus,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalStaff: number;
}


const DASHBOARD_POLL_INTERVAL_MS = 60_000; // 60s when WebSocket disconnected

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalStaff: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("7d");
  const user = tokenManager.getUser();

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const dashboardStats = await api.dashboard.getStats();
      setStats({
        totalProducts: dashboardStats.products?.total || 0,
        totalOrders: dashboardStats.orders?.total || 0,
        totalStaff: dashboardStats.staff?.total || 0,
      });
    } catch (err: unknown) {
      console.error("Failed to fetch dashboard stats:", err);
      const errorMessage = getErrorMessage(err);
      const axiosError = err as { response?: { status?: number } };
      if (axiosError?.response?.status === 401) {
        setError("Authentication required. Please login again.");
      } else if (axiosError?.response?.status === 403) {
        setError("Access denied. Admin or Staff accounts only.");
      } else {
        setError(
          errorMessage || "Failed to load dashboard statistics. Please ensure the backend is running."
        );
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      await fetchStats();
      if (!cancelled) setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchStats]);

  // Real-time: WebSocket (order:new, order:updated, inventory:updated) + polling fallback
  const { connected } = useRealtime({
    onNewOrder: fetchStats,
    onOrderUpdate: fetchStats,
    onInventoryUpdate: fetchStats,
    subscribeToOrdersList: true,
    enabled: true,
  });

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (connected) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }
    pollRef.current = setInterval(fetchStats, DASHBOARD_POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [connected, fetchStats]);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between relative z-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening with your business today.
          </p>
        </div>
        <div className="flex items-center gap-2 relative z-[10000]">
          <Badge variant={connected ? "default" : "destructive"} className="gap-1 relative z-0">
            <Activity className="h-3 w-3" />
            {connected ? "Live" : "Offline"}
          </Badge>
          <NotificationsNav />
          <ThemeToggle />
          <UserNav user={user} />
        </div>
      </div>

      <Separator />

      {/* Filters */}
      {/* <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div> */}

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error Loading Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Total Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="inline h-3 w-3 text-success mr-1" />
              Available in inventory
            </p>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Activity className="inline h-3 w-3 text-info mr-1" />
              {connected ? "Live updates active" : "Polling for updates"}
            </p>
          </CardContent>
        </Card>

        {/* Total Staff */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStaff}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <CheckCircle className="inline h-3 w-3 text-success mr-1" />
              Active team members
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <Button asChild variant="outline" className="justify-start w-full">
            <Link href="/admin/dashboard/products" className="flex items-center">
              <Plus className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">Add Product</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-start w-full">
            <Link href="/admin/dashboard/orders" className="flex items-center">
              <ShoppingCart className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">Manage Orders</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-start w-full">
            <Link href="/admin/dashboard/inventory" className="flex items-center">
              <Boxes className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">Update Inventory</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-start w-full">
            <Link href="/admin/dashboard/departments" className="flex items-center">
              <Settings className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">Manage Departments</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-start w-full">
            <Link href="/admin/dashboard/staff-accounts" className="flex items-center">
              <UserPlus className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">Add Staff Account</span>
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Current system health and connectivity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <div
                className={`rounded-full p-2 ${connected ? "bg-success/10" : "bg-destructive/10"}`}
              >
                <Activity className={`h-4 w-4 ${connected ? "text-success" : "text-destructive"}`} />
              </div>
              <div>
                <p className="text-sm font-medium">WebSocket</p>
                <p className="text-xs text-muted-foreground">
                  {connected ? "Connected" : "Disconnected"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-success/10 p-2">
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium">API Status</p>
                <p className="text-xs text-muted-foreground">Operational</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-success/10 p-2">
                <BarChart3 className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium">Performance</p>
                <p className="text-xs text-muted-foreground">Optimal</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
