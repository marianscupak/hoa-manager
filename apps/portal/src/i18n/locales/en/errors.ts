export default {
    USER_ALREADY_EXISTS: "A user with this email already exists.",
    USER_NOT_FOUND: "User not found.",
    INVALID_CREDENTIALS: "Invalid email or password.",
    INVALID_TOKEN: "Your session has expired. Please log in again.",
    UNAUTHORIZED: "You are not authorized to perform this action.",
    REPLAY_ATTACK: "Security violation detected. Please log in again.",
    INVITE_NOT_FOUND: "Invitation not found.",
    INVITE_EXPIRED: "This invitation has expired.",
    INVITE_ALREADY_ACCEPTED: "This invitation has already been accepted.",
    OWNER_ALREADY_CLAIMED: "This owner record is already linked to a user.",
    OWNER_EMAIL_REQUIRED: "An email address is required to send an invitation.",
    EMAIL_MISMATCH: "Your email does not match the one on the invitation.",
    EMAIL_NOT_VERIFIED: "Please verify your email before accepting.",
    ACCOUNT_EXISTS:
        "An account with this email already exists but is not linked to this community invitation. Please log in with your existing account.",
    USER_INACTIVE:
        "Your account is currently inactive or suspended. Please contact support.",
    UNIT_NOT_FOUND: "The requested property unit was not found.",
    OWNER_NOT_FOUND: "The requested property owner was not found.",
    TENANT_NOT_FOUND: "The requested community was not found.",
    DUPLICATE_UNIT_NUMBER:
        "A unit with this number already exists in this community.",
    DUPLICATE_OWNER_EMAIL:
        "An owner with this email already exists in this community.",
    INVALID_OWNERSHIP_SHARE: "Ownership share must be a positive number.",
    INVALID_OWNERSHIP_SUM:
        "Total ownership shares must sum exactly to 1.0 (100%).",
    UNKNOWN: "An unexpected error occurred. Please try again later.",
} as const;
