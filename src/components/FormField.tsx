import { type ReactNode, useId } from 'react';
import { Input } from './Input';

interface FormFieldProps {
    label: string;
    type?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    name?: string;
    autoComplete?: string;
    className?: string;
    error?: string;
    hint?: string;
    rightElement?: ReactNode;
}

/** A labelled text input for the sign-in, registration and setup forms. */
export function FormField({
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    required,
    minLength,
    maxLength,
    name,
    autoComplete,
    className = '',
    error,
    hint,
    rightElement,
}: FormFieldProps) {
    const id = useId();

    // The label points at the input with htmlFor, so the toggle button next to
    // the input does not become part of the input's accessible name.
    return (
        <div className="grid gap-1.5">
            <label htmlFor={id} className="text-ui text-muted">
                {label}
            </label>
            <div className="relative">
                <Input
                    id={id}
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    required={required}
                    minLength={minLength}
                    maxLength={maxLength}
                    name={name}
                    autoComplete={autoComplete}
                    controlSize="lg"
                    invalid={!!error}
                    className={`${rightElement ? 'pr-10' : ''} ${className}`}
                />
                {rightElement && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex">
                        {rightElement}
                    </div>
                )}
            </div>
            {error ? (
                <span className="text-xs text-danger">{error}</span>
            ) : (
                hint && <span className="text-xs text-muted">{hint}</span>
            )}
        </div>
    );
}
