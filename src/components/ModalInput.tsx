import { type LucideIcon } from 'lucide-react';

const inputClass =
    'w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors';

const iconClass =
    'absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4';

const labelClass = 'block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1';

interface ModalInputBaseProps {
    label: string;
    icon: LucideIcon;
    value: string | undefined;
    onChange: (value: string) => void;
}

interface ModalInputFieldProps extends ModalInputBaseProps {
    as?: 'input';
    type?: string;
    options?: never;
}

interface ModalSelectFieldProps extends ModalInputBaseProps {
    as: 'select';
    type?: never;
    options: { value: string; label: string }[];
}

type ModalInputProps = ModalInputFieldProps | ModalSelectFieldProps;

export function ModalInput({
    label,
    icon: Icon,
    as,
    type,
    value,
    onChange,
    options,
}: ModalInputProps) {
    return (
        <div>
            <label className={labelClass}>{label}</label>
            <div className="relative">
                <Icon className={iconClass} />
                {as === 'select' ? (
                    <select
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className={`${inputClass} appearance-none`}
                    >
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                ) : (
                    <input
                        type={type ?? 'text'}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className={inputClass}
                    />
                )}
            </div>
        </div>
    );
}
