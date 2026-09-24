import { Eye, EyeOff } from 'lucide-react';

interface PasswordToggleProps {
    visible: boolean;
    onToggle: () => void;
    label?: string;
}

export function PasswordToggle({ visible, onToggle, label }: PasswordToggleProps) {
    return (
        <button
            type="button"
            onClick={onToggle}
            aria-label={label}
            aria-pressed={visible}
            className="text-muted hover:text-fg transition-colors cursor-pointer"
        >
            {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
    );
}
