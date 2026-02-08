/**
 * Abbreviates a name for mobile display.
 * If the name is longer than the limit, it returns "First Name Last Initial."
 * Example: "John Doe" -> "John D."
 */
export const abbreviateName = (name: string, limit = 10): string => {
    if (!name) return "";
    if (name.length <= limit) return name;

    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
        return name.substring(0, limit);
    }

    const firstName = parts[0];
    const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
    const formatted = `${firstName} ${lastInitial}.`;

    return formatted.length > limit ? formatted.substring(0, limit - 3) + "..." : formatted;
};
