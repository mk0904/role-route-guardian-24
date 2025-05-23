
import { Check, X } from "lucide-react";

interface YesNoToggleProps {
  value: boolean | null;
  onChange: (value: boolean) => void;
  name: string;
  label?: string;
  inverseColors?: boolean;
}

export function YesNoToggle({ value, onChange, name, label, inverseColors = false }: YesNoToggleProps) {
  // For questions where "No" is positive (like abusive language question)
  // inverseColors will swap the color scheme
  return (
    <div className="space-y-2">
      {label && <div className="font-medium text-sm">{label}</div>}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`px-4 py-2 rounded-md flex items-center gap-1.5 transition-colors ${
            value === true
              ? inverseColors 
                ? "bg-red-100 text-red-700 border-2 border-red-300" 
                : "bg-green-100 text-green-700 border-2 border-green-300"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Check className={`h-4 w-4 ${
            value === true 
              ? inverseColors ? "text-red-500" : "text-green-500" 
              : "text-gray-400"
          }`} />
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`px-4 py-2 rounded-md flex items-center gap-1.5 transition-colors ${
            value === false
              ? inverseColors
                ? "bg-green-100 text-green-700 border-2 border-green-300"
                : "bg-red-100 text-red-700 border-2 border-red-300"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <X className={`h-4 w-4 ${
            value === false 
              ? inverseColors ? "text-green-500" : "text-red-500" 
              : "text-gray-400"
          }`} />
          No
        </button>
      </div>
    </div>
  );
}
