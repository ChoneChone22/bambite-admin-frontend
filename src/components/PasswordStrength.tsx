/**
 * Password Strength Indicator Component
 * Shows password requirements and strength level
 * Theme-aware for light/dark mode with semantic colors
 */

"use client";

interface PasswordStrengthProps {
  password: string;
}

interface PasswordCheck {
  label: string;
  test: (password: string) => boolean;
}

const passwordChecks: PasswordCheck[] = [
  {
    label: "At least 8 characters",
    test: (pwd) => pwd.length >= 8,
  },
  {
    label: "One uppercase letter",
    test: (pwd) => /[A-Z]/.test(pwd),
  },
  {
    label: "One lowercase letter",
    test: (pwd) => /[a-z]/.test(pwd),
  },
  {
    label: "One number",
    test: (pwd) => /\d/.test(pwd),
  },
  {
    label: "One special character (@$!%*?&)",
    test: (pwd) => /[@$!%*?&]/.test(pwd),
  },
];

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) {
    return null;
  }

  const checks = passwordChecks.map((check) => ({
    ...check,
    passed: check.test(password),
  }));

  const passedCount = checks.filter((c) => c.passed).length;
  const strength = passedCount;
  
  // Use semantic theme colors for strength levels
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = [
    "bg-destructive",      // Very Weak - red
    "bg-warning",          // Weak - orange/yellow
    "bg-warning",          // Fair - orange/yellow
    "bg-info",             // Good - blue
    "bg-success",          // Strong - green
  ];

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${strengthColors[strength - 1] || "bg-muted-foreground"}`}
            style={{ width: `${(strength / 5) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground min-w-[80px] text-right">
          {strengthLabels[strength - 1] || "Very Weak"}
        </span>
      </div>
      <ul className="space-y-1">
        {checks.map((check, index) => (
          <li
            key={index}
            className={`text-xs flex items-center gap-2 ${
              check.passed ? "text-success" : "text-muted-foreground"
            }`}
          >
            <span className={check.passed ? "text-success" : "text-muted-foreground"}>
              {check.passed ? "✓" : "○"}
            </span>
            <span>{check.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
