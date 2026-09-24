const initials = (name?: string | null) => {
    if (!name) return '?';
    const parts = name
        .trim()
        .split(/[\s._-]+/)
        .filter(Boolean);
    const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
    return letters.toUpperCase();
};

/** A round badge with the initials of a user name. */
export function Avatar({ name }: { name?: string | null }) {
    return (
        <span
            aria-hidden="true"
            className="flex-none w-7 h-7 rounded-full bg-raised grid place-items-center font-mono text-2xs text-fg"
        >
            {initials(name)}
        </span>
    );
}
