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
        "An account with this email already exists but is not linked to this association invitation. Please log in with your existing account.",
    USER_INACTIVE:
        "Your account is currently inactive or suspended. Please contact support.",
    INTERNAL_SERVER_ERROR:
        "An unexpected error occurred. Please try again later.",
    UNIT_NOT_FOUND: "The requested property unit was not found.",
    OWNER_NOT_FOUND: "The requested property owner was not found.",
    TENANT_NOT_FOUND: "The requested association was not found.",
    DUPLICATE_UNIT_NUMBER:
        "A unit with this number already exists in this association.",
    DUPLICATE_OWNER_EMAIL:
        "An owner with this email already exists in this association.",
    INVALID_OWNERSHIP_SHARE: "Ownership share must be a positive number.",
    INVALID_OWNERSHIP_SUM:
        "Total ownership shares must sum exactly to 1/1 (100%).",
    OWNERSHIP_SJM_MEMBERS_INVALID:
        "An SJM party must have exactly two distinct owners, both persons.",
    OWNERSHIP_MIXED_ASSOCIATION_UNSUPPORTED:
        "Ownership by the association cannot be combined with other owners.",
    OWNERSHIP_DUPLICATE_OWNER:
        "An owner appears more than once in the ownership split.",
    OWNER_ASSOCIATION_ALREADY_EXISTS:
        "An association owner already exists in this association.",
    UNKNOWN: "An unexpected error occurred. Please try again later.",
    VOTE_NOT_FOUND: "Vote not found.",
    VOTE_NOT_DRAFT:
        "The vote is no longer in draft mode and cannot be modified.",
    VOTE_RULESET_REQUIRED:
        "Voting ruleset must be set before adding questions.",
    VOTE_QUESTION_NOT_FOUND: "Question not found.",
    INVALID_VOTE_QUESTION:
        "Invalid question. Please check the text and options.",
    RULESET_CHANGE_BLOCKED:
        "Voting ruleset cannot be changed anymore as the vote has started or already contains questions.",
    VOTE_SCHEDULE_IN_PAST: "Scheduled dates cannot be in the past.",
    VOTE_SCHEDULE_INVALID_RANGE: "Invalid vote schedule range.",
    INVALID_VOTE_STATUS_FOR_DELEGATION:
        "Delegation is only allowed when the vote is in scheduled status.",
    NOT_A_UNIT_OWNER: "You are not an owner of this unit.",
    MEMBERSHIP_HAS_NO_ASSOCIATED_OWNER:
        "Your membership is not correctly linked to an owner profile.",
    MUTUAL_DELEGATION_NOT_ALLOWED:
        "Mutual delegation is not allowed. This person has already delegated their vote to you.",
    LAST_ADMIN_CANNOT_BE_REMOVED:
        "The last administrator cannot be removed or assigned a different role.",
    BALLOT_ALREADY_CAST: "You have already cast a ballot for this vote.",
    DELEGATION_NOT_FOUND: "The requested delegation was not found.",
    FORBIDDEN: "You do not have permission to perform this action.",
    INCOMPLETE_VOTE: "The vote configuration is incomplete.",
    INVALID_BALLOT_ANSWERS: "The submitted ballot answers are invalid.",
    INVALID_QUESTION_RULESET_OVERRIDE:
        "The question ruleset override is invalid.",
    MEMBERSHIP_NOT_FOUND: "User membership not found in this association.",
    NOT_UNIT_REPRESENTATIVE:
        "You are not the designated representative for this unit.",
    VOTE_MISSING_QUESTIONS: "The vote must contain at least one question.",
    VOTE_NOT_OPEN: "This vote is not currently open for voting.",
    VOTE_NOT_READY_TO_OPEN: "The vote is not ready to be opened.",
    VOTE_NOT_SCHEDULED: "The vote must be scheduled before it can be opened.",
    VOTE_QUESTION_MISSING_OPTIONS: "Some questions are missing options.",
    VOTE_SCHEDULE_MISSING_DATES:
        "The vote schedule is missing start or end dates.",
    VOTE_DOCUMENT_NOT_FOUND: "Document not found.",
    VOTE_DOCUMENT_LIMIT_REACHED:
        "This vote already has the maximum number of documents (20).",
    VOTE_DOCUMENT_TYPE_NOT_ALLOWED: "This file type is not allowed.",
    VOTE_DOCUMENT_TOO_LARGE: "The file exceeds the 50 MB limit.",
    VOTE_DOCUMENT_UPLOAD_INCOMPLETE:
        "The upload did not complete. Please try again.",
    DOCUMENT_STORAGE_NOT_CONFIGURED: "Document storage is not configured.",
} as const;
