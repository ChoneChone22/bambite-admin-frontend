import LoadingSpinner from "@/src/components/LoadingSpinner";

/**
 * Loading Component
 * Reusable loading spinner
 */

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner size="lg" />
    </div>
  );
}
