/**
 * Mobile Navigation Bar Component
 * Top navigation bar for mobile devices with hamburger menu
 * Theme-aware for light/dark mode
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
    <nav 
      className="md:hidden fixed top-0 left-0 right-0 z-50 shadow-sm"
      style={{
        backgroundColor: 'hsl(var(--card))',
        borderBottom: '1px solid hsl(var(--border))',
        opacity: 1
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Hamburger Menu Button */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          aria-label="Open menu"
        >
          <svg
            className="w-6 h-6 text-foreground"
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
          <h1 className="text-lg font-bold text-primary">
            {title}
          </h1>
        </div>

        {/* Spacer to balance hamburger button */}
        <div className="w-10" />
      </div>
    </nav>
  );
}
