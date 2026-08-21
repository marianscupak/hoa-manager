/**
 * Builds the avatar initials for a user: up to two initials from the full name,
 * falling back to the first letter of the email, then to "U".
 */
export function getInitials(name?: string, email?: string): string {
    if (name) {
        return name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    }
    if (email) return email[0].toUpperCase();
    return "U";
}
