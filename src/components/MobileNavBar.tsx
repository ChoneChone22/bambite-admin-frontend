/**
 * Mobile Navigation Bar Component
 * Top navigation bar for mobile devices with hamburger menu
 */

"use client";

interface MobileNavBarProps {
  onMenuClick: () => void;
  title: string;
  userEmail?: string; // Kept for backward compatibility but not displayed
  userName?: string; // Kept for backward compatibility but not displayed
}

export default function MobileNavBar({
  onMenuClick,
  title,
}: MobileNavBarProps) {

  return (
    <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Hamburger Menu Button */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Open menu"
        >
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Title */}
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold" style={{ color: "#2C5BBB" }}>
            {title}
          </h1>
        </div>

        {/* Spacer to balance hamburger button */}
        <div className="w-10" />
      </div>
    </nav>
  );
}
