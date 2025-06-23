import React from 'react';
import { Send, Loader2 } from 'lucide-react';

interface CreateButtonProps {
  onSubmit: () => void;
  isLoading: boolean;
  disabled: boolean;
}

export function CreateButton({ onSubmit, isLoading, disabled }: CreateButtonProps) {
  return (
    <div className="flex justify-center px-4">
      <button
        onClick={onSubmit}
        disabled={disabled || isLoading}
        className={`
          flex items-center justify-center space-x-2 sm:space-x-3 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-semibold text-base sm:text-lg transition-all duration-300 transform w-full sm:w-auto min-w-[200px] touch-manipulation
          ${
            disabled || isLoading
              ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white hover:scale-105 hover:shadow-2xl shadow-teal-500/25'
          }
          focus:outline-none focus:ring-4 focus:ring-teal-500/50 focus:ring-offset-2 focus:ring-offset-slate-900
        `}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
            <span>Creating Secret...</span>
          </>
        ) : (
          <>
            <Send className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>Create</span>
          </>
        )}
      </button>
    </div>
  );
}