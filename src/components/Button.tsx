import { Loader2 } from 'lucide-react';
import { type ComponentProps } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link' | 'danger' | 'danger-solid';
export type ButtonSize = 'inline' | 'sm' | 'md' | 'lg';

const base =
    'inline-flex items-center justify-center gap-2 rounded-sm whitespace-nowrap transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

const variants: Record<ButtonVariant, string> = {
    primary: 'bg-accent text-on-accent font-mono font-medium hover:bg-accent/90',
    secondary: 'border border-line text-fg-2 hover:border-line-strong hover:text-fg',
    ghost: 'text-muted hover:text-fg',
    link: 'text-accent hover:underline',
    danger: 'text-danger hover:underline',
    'danger-solid': 'bg-danger text-on-danger font-medium hover:bg-danger/90',
};

const sizes: Record<ButtonSize, string> = {
    inline: 'text-ui',
    sm: 'px-2.5 py-1.5 text-ui',
    md: 'px-3.5 py-2 text-ui',
    lg: 'px-4 py-2.5 text-sm',
};

interface ButtonClassOptions {
    variant?: ButtonVariant;
    size?: ButtonSize;
    className?: string;
}

/** Returns the button classes. Use it to style a `Link` or an `a` like a button. */
export function buttonClassName({
    variant = 'secondary',
    size = 'md',
    className = '',
}: ButtonClassOptions = {}) {
    return `${base} ${variants[variant]} ${sizes[size]} ${className}`;
}

interface ButtonProps extends ComponentProps<'button'>, ButtonClassOptions {
    loading?: boolean;
}

export function Button({
    variant,
    size,
    className,
    loading = false,
    disabled,
    type = 'button',
    children,
    ...props
}: ButtonProps) {
    return (
        <button
            type={type}
            disabled={disabled || loading}
            className={buttonClassName({ variant, size, className })}
            {...props}
        >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {children}
        </button>
    );
}
