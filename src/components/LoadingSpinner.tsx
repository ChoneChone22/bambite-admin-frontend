export default function LoadingSpinner({
  size = "md",
}: {
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-16 w-16 border-4",
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full`}
        style={{
          borderColor: 'hsl(var(--muted))',
          borderTopColor: 'hsl(var(--primary))',
          borderRightColor: 'hsl(var(--primary))',
          borderStyle: 'solid'
        } as React.CSSProperties}
        aria-label="Loading"
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}
