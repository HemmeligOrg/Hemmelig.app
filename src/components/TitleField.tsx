import React, { useState } from 'react';
import { Hash } from 'lucide-react';

interface TitleFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function TitleField({ value, onChange }: TitleFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="space-y-2">
      <div className={`relative transition-all duration-300 ${isFocused ? 'ring-2 ring-teal-500/50 ring-offset-2 ring-offset-slate-800' : ''}`}>
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
          <Hash className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Title"
          className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300"
        />
      </div>
      <p className="text-sm text-slate-400 ml-1">
        Give your secret a memorable title (optional)
      </p>
    </div>
  );
}