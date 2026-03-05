export default {
    status: {
        loading: "Checking invitation...",
        valid: "You've been invited!",
        expired: "This invitation has expired.",
        accepted: "This invitation has already been used.",
        notFound: "Invitation not found or invalid.",
        expiresAt: "Expires at: {{date}}",
        emailHint: "This invitation is for {{email}}",
    },
    actions: {
        acceptInvite: "Accept Invitation",
        goToDashboard: "Go to Dashboard",
        signIn: "Sign In",
        signInDescription: "Already have an account? Sign in to accept.",
        createAccount: "Create Account",
        createAccountDescription: "New here? Create an account to get started.",
    },
    register: {
        title: "Create Your Account",
        description:
            "Set a password to create your account and join the association.",
        passwordLabel: "Password",
        passwordPlaceholder: "Enter a password (min. 8 characters)",
        submit: "Create Account & Join",
        submitting: "Creating account...",
        success: "Account created! Redirecting...",
        error: "Failed to create account. Please try again.",
        accountExists:
            "An account with this email already exists. Please sign in instead.",
    },
    accept: {
        submit: "Accept Invitation",
        wrongAccount: "Wrong account?",
        loading: "Accepting invitation...",
        success: "Invitation accepted! Redirecting...",
        error: "Failed to accept invitation.",
        emailMismatch:
            "Your signed-in email doesn't match the invitation email.",
        notVerified: "Please verify your email address first.",
    },
} as const;
