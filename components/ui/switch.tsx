"use client";

import * as React from "react";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  label,
}: SwitchProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      {label && <span className="text-sm text-slate-300">{label}</span>}
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`w-11 h-6 rounded-full transition-colors ${
            checked ? "bg-indigo-600" : "bg-slate-600"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <div
            className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
              checked ? "translate-x-5" : "translate-x-0.5"
            } mt-0.5`}
          />
        </div>
      </div>
    </label>
  );
}
