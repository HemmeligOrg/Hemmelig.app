export const getPasswordStrength = (password: string): number => {
    const length = password.length;
    if (length === 0) return 0;

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    const typesCount = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

    if (length < 8) return 1;
    if (typesCount <= 1) return 1;

    let strength = 1;
    if (typesCount >= 2) strength = 2;
    if (typesCount >= 3) strength = 3;
    if (length >= 12 && typesCount >= 3) strength = 4;
    if (length >= 12 && typesCount === 4) strength = 5;

    return strength;
};
