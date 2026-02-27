export default {
    login: {
        error: "Login failed. Please check your credentials.",
        invalidEmail: "Invalid email address.",
        invalidPassword: "Password must not be empty.",
    },
    tenantSwitcher: {
        success: "Successfully switched tenant.",
        error: "Failed to switch tenant.",
    },
    googleCallback: {
        error: "Failed to authenticate with Google.",
    },
    selectTenant: {
        title: "Select a Community",
        loading: "Loading your communities...",
        noCommunities: "No communities found.",
        joining: "Joining...",
        notFound: "Don't see your community?",
        createNew: "Create a new community",
    },
} as const;
