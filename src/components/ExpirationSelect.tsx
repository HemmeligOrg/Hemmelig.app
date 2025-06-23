import React from 'react';
import { ChevronDown } from 'lucide-react';

interface ExpirationSelectProps {
  value?: Date;
  onChange: (date?: Date) => void;
}

export function ExpirationSelect({ value, onChange }: ExpirationSelectProps) {
  const options = [
    { label: '1 hour', value: 1 },
    { label: '1 day', value: 24 },
    { label: '3 days', value: 72 },
    { label: '1 week', value: 168 },
    { label: '1 month', value: 720 },
    { label: 'Never', value: 0 },
  ];

  const getCurrentValue = () => {
    if (!value) return 72; // Default to 3 days
    const hoursDiff = Math.round((value.getTime() - Date.now()) / (1000 * 60 * 60));
    return options.find(opt => opt.value === hoursDiff)?.value || 72;
  };

  const handleChange = (hours: number) => {
    if (hours === 0) {
      onChange(undefined);
    } else {
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + hours);
      onChange(expirationDate);
    }
  };

  return (
    <div className="relative">
      <select
        value={getCurrentValue()}
        onChange={(e) => handleChange(parseInt(e.target.value))}
        className="w-full appearance-none bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300 cursor-pointer hover:border-slate-500/50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-slate-700">
            {option.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <ChevronDown className="w-5 h-5 text-slate-400" />
      </div>
    </div>
  );
}