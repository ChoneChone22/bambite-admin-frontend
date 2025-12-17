/**
 * Auth Debug Page
 * Check authentication status and tokens
 */

"use client";

import { useEffect, useState } from "react";
import { getAuthToken, getUser } from "@/src/lib/axios";
import Link from "next/link";

export default function AuthDebugPage() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUserData] = useState<string | null>(null);

  useEffect(() => {
    setToken(getAuthToken());
    setUserData(getUser());
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom max-w-3xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🔍 Authentication Debug
          </h1>

          {/* Token Status */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Token Status</h2>
            <div className="bg-gray-100 rounded p-4">
              {token ? (
                <>
                  <p className="text-green-600 font-semibold mb-2">
                    ✅ Token Found
                  </p>
                  <p className="text-xs text-gray-600 break-all font-mono">
                    {token}
                  </p>
                </>
              ) : (
                <p className="text-red-600 font-semibold">❌ No Token Found</p>
              )}
            </div>
          </div>

          {/* User Data */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">User Data</h2>
            <div className="bg-gray-100 rounded p-4">
              {user ? (
                <>
                  <p className="text-green-600 font-semibold mb-2">
                    ✅ User Data Found
                  </p>
                  <pre className="text-xs text-gray-800 overflow-auto">
                    {JSON.stringify(JSON.parse(user), null, 2)}
                  </pre>
                </>
              ) : (
                <p className="text-red-600 font-semibold">
                  ❌ No User Data Found
                </p>
              )}
            </div>
          </div>

          {/* Backend Status */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">
              Backend Configuration
            </h2>
            <div className="bg-gray-100 rounded p-4 space-y-2">
              <p>
                <strong>API URL:</strong>{" "}
                {process.env.NEXT_PUBLIC_API_URL ||
                  "http://localhost:3000/api/v1"}
              </p>
              <p>
                <strong>Frontend URL:</strong>{" "}
                {typeof window !== "undefined" ? window.location.origin : "N/A"}
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">What to do?</h2>
            <div className="space-y-4">
              {!token ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                  <p className="font-semibold text-yellow-800 mb-2">
                    ⚠️ You are not logged in
                  </p>
                  <p className="text-sm text-yellow-700 mb-4">
                    You need to login first to access protected features like
                    cart and orders.
                  </p>
                  <div className="flex gap-3">
                    <Link href="/login" className="btn-primary">
                      Login
                    </Link>
                    <Link href="/register" className="btn-secondary">
                      Register
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded p-4">
                  <p className="font-semibold text-green-800 mb-2">
                    ✅ You are logged in
                  </p>
                  <p className="text-sm text-green-700 mb-4">
                    If you're getting CORS errors, your backend needs to be
                    configured.
                  </p>
                  <Link
                    href="/BACKEND_SETUP.md"
                    className="text-blue-600 underline"
                  >
                    See Backend Setup Guide
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* CORS Error Fix */}
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h3 className="font-semibold text-blue-800 mb-2">
              🔧 CORS Error Fix
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              Add this to your backend:
            </p>
            <pre className="bg-blue-900 text-blue-50 p-3 rounded text-xs overflow-auto">
              {`// Install: npm install cors
const cors = require('cors');

app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));`}
            </pre>
          </div>

          {/* Actions */}
          <div className="mt-8 flex gap-4">
            <Link href="/" className="btn-primary">
              Go Home
            </Link>
            <Link href="/products" className="btn-secondary">
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
