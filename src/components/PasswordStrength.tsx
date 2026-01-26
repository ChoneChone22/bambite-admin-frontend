/**
 * Password Strength Indicator Component
 * Shows password requirements and strength level
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
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-blue-500",
    "bg-green-500",
  ];

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${strengthColors[strength - 1] || "bg-gray-300"}`}
            style={{ width: `${(strength / 5) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium text-gray-600 min-w-[80px] text-right">
          {strengthLabels[strength - 1] || "Very Weak"}
        </span>
      </div>
      <ul className="space-y-1">
        {checks.map((check, index) => (
          <li
            key={index}
            className={`text-xs flex items-center gap-2 ${
              check.passed ? "text-green-600" : "text-gray-500"
            }`}
          >
            <span className={check.passed ? "text-green-600" : "text-gray-400"}>
              {check.passed ? "✓" : "○"}
            </span>
            <span>{check.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
