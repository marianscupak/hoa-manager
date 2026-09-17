import { getApiErrorCode } from "@/api/error-utils";

export type LoginFailure = { kind: "verify" } | { kind: "show" };

/**
 * An account that exists and took the right password but never proved its
 * address is not a failed sign-in — it is an unfinished registration. It goes
 * to the code screen rather than to a red toast.
 */
export function decideLoginFailure(err: unknown): LoginFailure {
    return getApiErrorCode(err) === "EMAIL_NOT_VERIFIED"
        ? { kind: "verify" }
        : { kind: "show" };
}
