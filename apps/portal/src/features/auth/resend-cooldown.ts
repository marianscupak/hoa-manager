/**
 * The server allows three resends an hour. The button holds the user back
 * long before that, so a second click is a wait rather than a 429 they cannot
 * interpret.
 */
export const RESEND_COOLDOWN_SECONDS = 60;

export function remainingCooldownSeconds(
    lastSentAt: Date | null,
    now: Date,
    windowSeconds: number = RESEND_COOLDOWN_SECONDS,
): number {
    if (!lastSentAt) return 0;

    const elapsedMs = now.getTime() - lastSentAt.getTime();
    const remainingMs = windowSeconds * 1000 - elapsedMs;

    return remainingMs <= 0 ? 0 : Math.ceil(remainingMs / 1000);
}
