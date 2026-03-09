import { Eye, EyeOff } from 'lucide-react';

interface PasswordToggleProps {
    visible: boolean;
    onToggle: () => void;
}

export function PasswordToggle({ visible, onToggle }: PasswordToggleProps) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors duration-200"
        >
            {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
    );
}
