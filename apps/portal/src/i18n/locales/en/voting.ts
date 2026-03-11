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
            ruleset: {
                title: "Vote Ruleset",
                description:
                    "Configure quorum, electoral thresholds, and weighting rules.",
            },
            questions: {
                title: "Questions",
                description: "Add questions and options for this vote.",
                defaultTitle: "New Question",
                addQuestion: "Add Question",
                emptyState:
                    "No questions added yet. Add your first question using the button above.",
                loadError: "Failed to load vote details.",
                createSuccess: "Question added successfully",
                deleteConfirm: "Are you sure you want to delete this question?",
                deleteSuccess: "Question deleted",
                updateSuccess: "Question updated",
                saving: "Saving changes...",
                autoSave: "Changes are saved automatically",
                fields: {
                    title: {
                        label: "Question Text",
                        placeholder: "Enter the question...",
                    },
                    description: {
                        label: "Additional Description",
                        placeholder: "Optional explanation for the question...",
                    },
                    type: {
                        label: "Answer Type",
                        options: {
                            YES_NO: "Yes / No",
                            SINGLE_CHOICE: "Single Choice",
                        },
                    },
                },
                options: {
                    title: "Options",
                    addOption: "Add Option",
                    placeholder: "Option text...",
                    defaultLabel: "Option",
                    abstain: "Abstain (automatically added)",
                },
            },
        },
        optionLabels: {
            YES: "For",
            NO: "Against",
            ABSTAIN: "Abstained",
        },
        fields: {
            title: {
                label: "Title",
                placeholder: "e.g. Roof Repair Approval",
                errors: {
                    required: "Title is required",
                },
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
            weightBasis: {
                label: "Weight Basis",
                placeholder: "Select weight basis",
                options: {
                    UNIT_SHARE: "Unit Share",
                    ONE_UNIT_ONE_VOTE: "One Unit One Vote",
                },
            },
            quorumElectorateBasis: {
                label: "Quorum Electorate Basis",
                placeholder: "Select basis",
                options: {
                    ALL_UNITS: "All Units",
                    ELIGIBLE_UNITS_ONLY: "Eligible Units Only",
                },
            },
            quorumMeasure: {
                label: "Quorum Measure",
                placeholder: "Select measure",
                options: {
                    UNIT_SHARE: "Unit Share",
                    UNIT_COUNT: "Unit Count",
                },
            },
            quorumThreshold: {
                label: "Quorum Threshold",
                placeholder: "Enter quorum threshold value",
                errors: {
                    positiveNumber: "Must be a positive number",
                },
            },
            majorityRuleType: {
                label: "Majority Rule Type",
                placeholder: "Select rule type",
                options: {
                    SIMPLE_MAJORITY: "Simple Majority",
                    QUALIFIED_MAJORITY: "Qualified Majority",
                },
            },
            majorityThreshold: {
                label: "Majority Threshold",
                placeholder: "Enter majority threshold if qualified",
                errors: {
                    positiveNumber: "Must be a positive number",
                },
            },
            allowAbstain: {
                label: "Allow Abstain Options?",
                description:
                    "Enables voters to explicitly abstain from voting on questions.",
            },
            abstainExcluded: {
                label: "Exclude Abstains From Majority?",
                description:
                    "If true, abstain votes are omitted from the denominator when evaluating majority thresholds.",
            },
            time: "Time",
        },
        actions: {
            next: "Next step",
            back: "Back",
            submit: "Apply Rules & Finish",
            saved: "Saved",
            saveNext: "Save and Continue",
            finishLater: "Finish Later",
            finish: "Finish",
        },
        toast: {
            success: "Vote created successfully",
            error: "Failed to create vote",
            rulesetError: "Failed to configure ruleset",
            rulesetSuccess: "Ruleset configured successfully",
        },
    },
};
