import { useState } from 'react';

interface ViewsSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function ViewsSlider({ value, onChange }: ViewsSliderProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange(1);
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      onChange(Math.min(999, Math.max(1, num)));
    }
  };
  
  return (
    <div className="flex items-center justify-end">
      <input
        type="number"
        min="1"
        max="999"
        value={value}
        onChange={handleInputChange}
        className="w-20 px-3 py-2 bg-gray-100 dark:bg-dark-700/50 border border-gray-300 dark:border-dark-500/50 text-gray-900 dark:text-slate-100 text-center focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
      />
    </div>
  );
}
