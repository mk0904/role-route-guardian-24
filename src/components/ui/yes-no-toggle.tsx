
import React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface YesNoToggleProps {
  label?: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

const YesNoToggle = ({
  label,
  value,
  onChange,
  disabled = false,
}: YesNoToggleProps) => {
  return (
    <div className="space-y-2">
      {label && (
        <div className="font-medium text-base">{label}</div>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onChange(true)}
          disabled={disabled}
          className={cn(
            "flex items-center justify-center gap-2 px-6 py-2 rounded-md border transition-all",
            value === true
              ? "bg-green-500 border-green-600 text-white font-medium"
              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
          )}
        >
          <Check className={cn("h-4 w-4", value === true ? "text-white" : "text-gray-500")} />
          <span>Yes</span>
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          disabled={disabled}
          className={cn(
            "flex items-center justify-center gap-2 px-6 py-2 rounded-md border transition-all",
            value === false
              ? "bg-red-500 border-red-600 text-white font-medium"
              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
          )}
        >
          <X className={cn("h-4 w-4", value === false ? "text-white" : "text-gray-500")} />
          <span>No</span>
        </button>
      </div>
    </div>
  );
};

export { YesNoToggle };
