import { type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

interface FormFieldProps {
    label: string;
    icon: LucideIcon;
    type?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    name?: string;
    className?: string;
    error?: string;
    rightElement?: ReactNode;
}

export function FormField({
    label,
    icon: Icon,
    type = 'text',
    value,
    onChange,
    placeholder,
    required,
    minLength,
    maxLength,
    name,
    className = '',
    error,
    rightElement,
}: FormFieldProps) {
    const hasRightElement = !!rightElement;

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600 dark:text-slate-300">
                {label}
            </label>
            <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500">
                    <Icon className="w-4 h-4" />
                </div>
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    required={required}
                    minLength={minLength}
                    maxLength={maxLength}
                    name={name}
                    className={`w-full pl-10 ${hasRightElement ? 'pr-10' : 'pr-4'} py-3 bg-gray-50 dark:bg-dark-700/50 border ${error ? 'border-red-500' : 'border-gray-200 dark:border-dark-500/50'} text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all duration-200 ${className}`}
                />
                {rightElement && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {rightElement}
                    </div>
                )}
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}
