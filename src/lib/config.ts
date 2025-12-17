/**
 * Environment Variables Configuration
 * Add this to your .env.local file:
 * NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
 */

export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1",
  appName: "Bambite",
  appVersion: "1.0.0",
} as const;
