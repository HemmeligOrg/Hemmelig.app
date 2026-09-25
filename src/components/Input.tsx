import { ChevronDown } from 'lucide-react';
import { type ComponentProps, type ReactNode } from 'react';

type ControlSize = 'md' | 'lg';

interface ControlOptions {
    mono?: boolean;
    invalid?: boolean;
    controlSize?: ControlSize;
    className?: string;
}

const sizes: Record<ControlSize, string> = {
    md: 'px-2.5 py-2 text-ui',
    lg: 'px-3 py-2.5 text-sm',
};

/** Returns the shared classes for text inputs, text areas and selects. */
export function inputClassName({
    mono = false,
    invalid = false,
    controlSize = 'md',
    className = '',
}: ControlOptions = {}) {
    return [
        'w-full bg-surface text-fg border rounded-sm outline-none transition-colors',
        'placeholder:text-faint focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed',
        invalid ? 'border-danger' : 'border-line',
        mono ? 'font-mono' : '',
        sizes[controlSize],
        className,
    ].join(' ');
}

type InputProps = ComponentProps<'input'> & ControlOptions;

export function Input({ mono, invalid, controlSize, className, ...props }: InputProps) {
    return (
        <input
            className={inputClassName({ mono, invalid, controlSize, className })}
            aria-invalid={invalid || undefined}
            {...props}
        />
    );
}

type TextareaProps = ComponentProps<'textarea'> & ControlOptions;

export function Textarea({ mono, invalid, controlSize, className, ...props }: TextareaProps) {
    return (
        <textarea
            className={inputClassName({
                mono,
                invalid,
                controlSize,
                className: `resize-y ${className ?? ''}`,
            })}
            aria-invalid={invalid || undefined}
            {...props}
        />
    );
}

type SelectProps = ComponentProps<'select'> & ControlOptions;

export function Select({ mono, invalid, controlSize, className, children, ...props }: SelectProps) {
    return (
        <div className={`relative ${className ?? ''}`}>
            <select
                className={inputClassName({
                    mono,
                    invalid,
                    controlSize,
                    className: 'appearance-none pr-8 cursor-pointer',
                })}
                {...props}
            >
                {children}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
        </div>
    );
}

interface FieldProps {
    label: ReactNode;
    hint?: ReactNode;
    error?: ReactNode;
    children: ReactNode;
    className?: string;
}

/** A label above a control, with an optional hint or error below it. */
export function Field({ label, hint, error, children, className = '' }: FieldProps) {
    return (
        <label className={`grid gap-1.5 ${className}`}>
            <span className="text-ui text-muted">{label}</span>
            {children}
            {error ? (
                <span className="text-xs text-danger">{error}</span>
            ) : (
                hint && <span className="text-xs text-muted">{hint}</span>
            )}
        </label>
    );
}
