export const voting = {
    navigation: {
        activeVotes: "Active Votes",
        results: "Results",
        createVote: "Create Vote",
        delegations: "Delegations",
    },
    common: {
        save: "Save",
        cancel: "Cancel",
    },
    create: {
        title: "Create Vote",
        titleEdit: "Edit Vote",
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
                defaultDescription:
                    "These rules will apply to all questions by default. You can override them per question later.",
            },
            questions: {
                title: "Questions",
                description: "Add questions and options for this vote.",
                defaultTitle: "New Question",
                addQuestion: "Add Question",
                emptyState:
                    "No questions added yet. Use the button above to add your first question.",
                loadError:
                    "System was unable to load vote details. Please try again.",
                createSuccess: "Question added successfully",
                deleteConfirm: "Are you sure you want to delete this question?",
                deleteSuccess: "Question deleted",
                updateSuccess: "Question updated",
                saving: "Saving changes...",
                autoSave: "All changes are saved automatically",
                editQuestion: "Edit Question",
                actions: {
                    edit: "Edit",
                },
                fields: {
                    title: {
                        label: "Question Text",
                        placeholder: "e.g. Do you agree with the 2026 budget?",
                    },
                    description: {
                        label: "Explanatory Note (Optional)",
                        placeholder: "Provide additional context for voters...",
                    },
                    type: {
                        label: "Answer Type",
                        options: {
                            YES_NO: "Yes / No / Abstain",
                            SINGLE_CHOICE: "Multiple Choice (Single Answer)",
                        },
                    },
                },
                options: {
                    title: "Answer Options",
                    addOption: "Add Option",
                    placeholder: "Enter option text...",
                    defaultLabel: "Option",
                    abstain: "Abstain (automatically added when enabled)",
                },
                override: {
                    toggleActive: "Hide custom rules",
                    toggleInactive: "Customize rules for this question",
                    description:
                        "These settings override the vote-level defaults for this question only. Other questions will continue using the default ruleset.",
                    apply: "Apply Custom Rules",
                    update: "Update Custom Rules",
                    remove: "Revert to Default Rules",
                    badge: "Custom rules",
                    defaultHint:
                        "This question uses the vote-level default ruleset. Click to customize.",
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
                label: "Scheduled From",
                description: "When should the vote automatically open?",
            },
            scheduledTo: {
                label: "Scheduled To",
                description: "When should the vote automatically close?",
            },
            shortVotingPeriodWarning:
                "The voting period is shorter than 15 days. Consider extending it to give all owners enough time to vote.",
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
                label: "Quorum Threshold (%)",
                placeholder: "e.g. 50",
                errors: {
                    positiveNumber: "Must be a positive number",
                    max: "Must be at most 100 %",
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
                label: "Majority Threshold (%)",
                placeholder: "e.g. 66",
                errors: {
                    positiveNumber: "Must be a positive number",
                    max: "Must be at most 100 %",
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
            allowCoOwnerIndividualVote: {
                label: "Allow Co-Owners to Vote Individually?",
                description:
                    "If enabled, each co-owner of a unit can cast their own ballot instead of requiring a single representative.",
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
            finish: "Review Vote Draft",
        },
        toast: {
            createSuccess: "Vote created successfully",
            updateSuccess: "Vote updated successfully",
            error: "Failed to create vote",
            rulesetError: "Failed to configure ruleset",
            rulesetSuccess: "Ruleset configured successfully",
            scheduleSuccess: "Vote scheduled successfully",
        },
    },
    list: {
        title: "Active & Scheduled Votings",
        description:
            "Overview of all upcoming votings requiring you attention or upcoming soon.",
        error: "Failed to load votes.",
        filters: {
            all: "All",
            open: "Open",
            scheduled: "Scheduled",
            closed: "Closed",
        },
        empty: {
            all: "No votes found.",
            filtered: "No {{status}} votes found.",
        },
        status: {
            OPEN: "Open",
            SCHEDULED: "Scheduled",
            CLOSED: "Closed",
            DRAFT: "Draft",
        },
        card: {
            endsOn: "Ends on ",
            startsOn: "Starts on ",
            noDescription: "No description provided.",
            canVote: "You can vote",
            voteRequired: "Your vote is required.",
            voteAction: "Vote",
            delegationNeeded: "Delegation needed",
            fromCoOwners: "From co-owners",
            manageDelegation: "Manage Delegation",
            readyToVote: "Ready to vote",
            readyToVoteSubtitle: "You are eligible when voting opens.",
            alreadyDelegated: "Delegated",
            alreadyDelegatedSubtitle: "You have assigned a representative.",
            scheduledStatus: "Scheduled",
            scheduledSubtitle: "This vote has not started yet.",
            viewDetails: "View Details",
            completed: "Voting Completed",
            viewOutcomes: "View final outcomes",
            viewResults: "View Results",
            draftStatus: "Draft Vote",
            editDraft: "Configuration is incomplete",
            editAction: "Edit Vote",
        },
    },
    detail: {
        timeline: {
            startDate: "START DATE",
            endDate: "END DATE",
            notSet: "Not set",
        },
        description: {
            title: "Description",
        },
        actions: {
            edit: "Edit Vote",
            schedule: "Schedule Vote",
            scheduleConfirmTitle: "Schedule Vote",
            scheduleConfirmDescription:
                "Are you sure you want to schedule this vote? This action will make the vote visible to regular users and is irreversible. You will no longer be able to edit the vote details or ruleset.",
            cancel: "Cancel",
            confirm: "Yes, Schedule Vote",
        },
        validation: {
            title: "Incomplete Vote Configuration",
            description:
                "The following issues must be resolved before this vote can be scheduled:",
            goToEdit: "Go to Edit",
            close: "Close",
            errors: {
                VOTE_SCHEDULE_MISSING_DATES:
                    "Both start and end dates must be scheduled.",
                VOTE_SCHEDULE_IN_PAST: "Scheduled dates cannot be in the past.",
                VOTE_SCHEDULE_INVALID_RANGE:
                    "The start date must be before the end date.",
                VOTE_MISSING_QUESTIONS:
                    "At least one question must be added to the vote.",
                VOTE_QUESTION_MISSING_OPTIONS:
                    'Question "{{param}}" requires at least two answer options.',
                VOTE_RULESET_REQUIRED: "A default ruleset must be configured.",
            },
        },
        documents: {
            title: "Documents",
            uploaded: "Uploaded",
        },
        questions: {
            title: "Voting Items",
            preview: "Preview of questions you will vote on",
            majorityPrefix: "Requires",
            majoritySuffix: "majority of all shares.",
            customRules: "(custom rules)",
        },
        statusSidebar: {
            title: "Your Voting Status",
            opensIn: "Voting starts",
            closesIn: "Voting ends",
            owningUnits: "OWNING UNITS",
            share: "Share:",
            statusReady: "Ready",
            statusDelegation: "Requires delegation",
            statusVoted: "Voted",
            statusDelegated: "Delegated",
            delegationWarning:
                "{{unitName}} is co-owned. A common representative must be chosen.",
            manageDelegation: "Manage Delegation",
            totalPower: "Total Voting Power:",
            voteButton: "Vote",
            secureBoothHint:
                'By clicking "Vote", you will enter the secure voting booth.',
            help: {
                title: "Have Questions?",
                description:
                    "If you have questions about the questions, contact the chairman.",
                contact: "Contact chairman",
            },
            time: {
                hour: "hour",
                hours: "hours",
            },
        },
    },
    delegate: {
        title: "Delegate Your Vote",
        backToVote: "Back to vote detail",
        votingEvent: "Voting Event",
        cancelExisting: "Cancel delegation",
        selectUnit: "Select Unit",
        whoWillRepresent: "Who will represent you?",
        searchByCoOwner: "Search co-owners by name",
        noCandidatesFound: "No eligible co-owners found.",
        noSelectableUnits:
            "All your units have already been delegated in this event.",
        assignedToYou: "Assigned to you",
        alreadyDelegated: "Already delegated",
        confirmButton: "Confirm Delegation",
        confirming: "Confirming...",
        terms: 'By clicking "Confirm Delegation", you agree to the HOA Portal digital voting terms and conditions.',
        notice: {
            title: "Important Notice",
            description:
                "Once you delegate your vote for this unit, you cannot vote personally in this specific event unless you revoke the delegation before the vote starts.",
        },
        summary: {
            title: "Delegation Summary",
            unit: "Unit",
            voteShare: "Vote Share",
            delegate: "Delegate",
            notSelected: "Not selected",
        },
        modal: {
            title: "Confirm Delegation",
            description:
                "Please review the delegation details before confirming.",
            warning:
                "By confirming, you authorize the selected representative to vote on your behalf for this unit. You can revoke this before the voting starts.",
            toast: {
                success: "Delegation created successfully",
                error: "Failed to create delegation",
            },
            delegateLabel: "DELEGATE",
            delegateSubtext: "Authorized Person",
            unitLabel: "UNIT",
            unitSubtext: "Property Asset",
            eventLabel: "VOTING EVENT",
            eventSubtext: "Agenda Item",
            revocableTitle: "Revocable action",
            revocableDescription:
                "You can cancel this delegation via your dashboard at any time before the vote begins.",
            terms: "By proceeding, you acknowledge that this delegation complies with the statutes of the HOA. This action grants full voting power for this specific agenda item to the designated delegate listed above.",
            allowAction: "Allow person to vote on my behalf",
        },
    },
    delegations: {
        title: "Delegations",
        description: "Manage who can vote on your behalf.",
        help: {
            title: "How Delegation Works",
            description:
                "A delegation allows another person to vote on your behalf for specific units in a scheduled voting event.",
            rules: [
                "Only one person can vote for a unit.",
                "Mutual delegation is not allowed (x delegates to y, y cannot delegate to x).",
                "You can revoke your delegation at any time before the vote starts.",
            ],
        },
        tabs: {
            myDelegations: "My Delegations",
            recordProxy: "Record Proxy (Admin)",
        },
        table: {
            unit: "Unit",
            vote: "Vote",
            from: "Principal",
            to: "Proxy",
            date: "Recorded On",
            actions: "Actions",
            revoke: "Revoke",
            revokeSuccess: "Delegation revoked successfully",
        },
        empty: {
            title: "No delegations found",
            description:
                "You haven't delegated your vote to anyone yet, and no one has delegated their vote to you.",
            all: "No active delegations found.",
            filtered: "No delegations for the selected vote.",
        },
        filter: {
            vote: "Filter by Vote",
            allVotes: "All Scheduled Votes",
        },
        admin: {
            title: "Record Proxy Delegation",
            description:
                "As an administrator, you can record a delegation on behalf of an owner who provided you with a physical consent form.",
            selectVote: "Select Vote",
            selectUnit: "Select Unit",
            selectOwner: "Principal",
            selectDelegate: "Proxy",
            success: "Proxy delegation recorded successfully",
        },
    },
};
