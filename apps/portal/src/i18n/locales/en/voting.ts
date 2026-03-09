export const voting = {
    navigation: {
        activeVotes: "Active Votes",
        results: "Results",
        createVote: "Create Vote",
    },
    create: {
        title: "Create Vote",
        description: "Set up a new vote for the association.",
        steps: {
            basicInfo: {
                title: "Basic Information",
                description: "Provide the primary details for this vote.",
            },
            rules: {
                title: "Rules",
                description:
                    "Define the voting weight, quorum, and majority rules.",
            },
            questions: {
                title: "Questions",
                description: "Add questions and options for this vote.",
            },
        },
        fields: {
            title: {
                label: "Title",
                placeholder: "e.g. Roof Repair Approval",
            },
            description: {
                label: "Description",
                placeholder: "e.g. Describe the purpose of this vote.",
            },
            scheduledFrom: {
                label: "Scheduled From (Local Time)",
                description: "When should the vote automatically open?",
            },
            scheduledTo: {
                label: "Scheduled To (Local Time)",
                description: "When should the vote automatically close?",
            },
        },
        actions: {
            next: "Next step",
            back: "Back",
            submit: "Create Vote",
        },
        toast: {
            success: "Vote created successfully",
            error: "Failed to create vote",
        },
    },
};
