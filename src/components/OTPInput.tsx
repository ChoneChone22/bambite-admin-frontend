/**
 * OTP Input Component
 * 6-digit OTP input with auto-advance, paste support, and keyboard navigation
 */

"use client";

import { useEffect, useRef } from "react";

interface OTPInputProps {
  value: string;
  onChange: (otp: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export default function OTPInput({
  value,
  onChange,
  error,
  disabled = false,
  autoFocus = false,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (index: number, digit: string) => {
    // Only allow numeric digits
    if (digit && !/^\d$/.test(digit)) {
      return;
    }

    const newValue = value.split("");
    newValue[index] = digit;
    const updatedValue = newValue.join("").slice(0, 6);
    onChange(updatedValue);

    // Auto-advance to next input
    if (digit && index < 5) {
      const nextInput = inputRefs.current[index + 1];
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace - move to previous input if current is empty
    if (e.key === "Backspace" && !value[index] && index > 0) {
      const prevInput = inputRefs.current[index - 1];
      prevInput?.focus();
    }

    // Handle arrow keys
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      const prevInput = inputRefs.current[index - 1];
      prevInput?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      const nextInput = inputRefs.current[index + 1];
      nextInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d+$/.test(pasted)) {
      onChange(pasted);
      // Focus last input after paste
      const lastIndex = Math.min(pasted.length - 1, 5);
      const lastInput = inputRefs.current[lastIndex];
      lastInput?.focus();
    }
  };

  return (
    <div className="w-full">
      <div className="flex gap-2 justify-center">
        {Array.from({ length: 6 }).map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[index] || ""}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={`
              w-12 h-12 text-center text-lg font-semibold
              border-2 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              transition-colors
              bg-white text-gray-900
              ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-300"}
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-text"}
            `}
            aria-label={`OTP digit ${index + 1}`}
            aria-invalid={error ? "true" : "false"}
          />
        ))}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}
