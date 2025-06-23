import React from 'react';

interface ViewsSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function ViewsSlider({ value, onChange }: ViewsSliderProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          type="range"
          min="1"
          max="100"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider touch-manipulation"
          style={{
            background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${(value - 1) / 99 * 100}%, #475569 ${(value - 1) / 99 * 100}%, #475569 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1 px-1">
          <span>1</span>
          <span>100+</span>
        </div>
      </div>
      <div className="text-center">
        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-teal-500/20 text-teal-400 border border-teal-500/30">
          {value} view{value !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}