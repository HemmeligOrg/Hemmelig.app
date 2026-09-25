import { Input, Select } from './Input';

interface ModalInputBaseProps {
    label: string;
    value: string | undefined;
    onChange: (value: string) => void;
}

interface ModalInputFieldProps extends ModalInputBaseProps {
    as?: 'input';
    type?: string;
    autoComplete?: string;
    options?: never;
}

interface ModalSelectFieldProps extends ModalInputBaseProps {
    as: 'select';
    type?: never;
    autoComplete?: never;
    options: { value: string; label: string }[];
}

type ModalInputProps = ModalInputFieldProps | ModalSelectFieldProps;

/** A labelled input or select for the forms inside a modal. */
export function ModalInput({
    label,
    as,
    type,
    autoComplete,
    value,
    onChange,
    options,
}: ModalInputProps) {
    return (
        <label className="grid gap-1.5">
            <span className="text-ui text-muted">{label}</span>
            {as === 'select' ? (
                <Select
                    aria-label={label}
                    value={value ?? ''}
                    onChange={(e) => onChange(e.target.value)}
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </Select>
            ) : (
                <Input
                    aria-label={label}
                    type={type ?? 'text'}
                    autoComplete={autoComplete}
                    value={value ?? ''}
                    onChange={(e) => onChange(e.target.value)}
                />
            )}
        </label>
    );
}
