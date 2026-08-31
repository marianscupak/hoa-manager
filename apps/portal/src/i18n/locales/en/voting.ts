export const voting = {
    hub: {
        title: "Voting",
        newVote: "New vote",
        tabs: {
            active: "Active & upcoming",
            results: "Results",
            delegations: "Delegations",
        },
        groups: {
            needsAction: "Needs your action",
            upcoming: "Upcoming & open",
            drafts: "Drafts",
        },
        continueEditing: "Continue editing",
    },
    common: {
        save: "Save",
        cancel: "Cancel",
    },
    mode: {
        PER_ROLLAM: {
            label: "Per rollam",
        },
        ASSEMBLY_RECORD: {
            label: "Assembly record",
        },
    },
    rules: {
        sentence: "Passes with {{majority}} {{denominator}}, {{weighting}}.",
        majoritySimple: "a simple majority (more than 50 %)",
        majorityQualified: "a qualified majority (at least {{threshold}} %)",
        majorityUnanimity: "unanimous consent (100 %)",
        ofVotesCast: "of votes cast",
        ofAllVotes: "of all votes",
        ofVotesCastExclAbstain: "of votes cast (abstentions excluded)",
        weightedByShares: "weighted by ownership shares",
        onePerUnit: "one vote per unit",
        inPlainLanguage: "In plain language",
        customRule: "custom rule",
    },
    create: {
        description: "Set up a new vote for the association.",
        mode: {
            PER_ROLLAM: {
                title: "Per-rollam vote",
                description:
                    "A written vote held outside a meeting. Decided by a majority of **all** owners' votes; window must be at least 15 days.",
            },
            ASSEMBLY_RECORD: {
                title: "Assembly record",
                description:
                    "Records the results of an in-person assembly. Quorum is a simple majority of all votes; decided by a majority of those present.",
            },
        },
        steps: {
            mode: {
                title: "Vote type",
                description:
                    "Choose whether this is a per-rollam vote or an assembly record. The type can't be changed once the vote is created.",
            },
            basicInfo: {
                title: "Details",
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
                        "Overrides the vote-level majority rules for this question only. Quorum always applies to the whole vote.",
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
                cards: {
                    UNIT_SHARE: {
                        hint: "Votes weighted by ownership share",
                    },
                    ONE_UNIT_ONE_VOTE: {
                        hint: "Every unit counts equally",
                    },
                },
            },
            quorum: {
                label: "Quorum",
                perRollamNone:
                    "A per-rollam vote has no quorum — the majority is counted from all votes in the building.",
            },
            quorumMeasure: {
                options: {
                    UNIT_SHARE: "Unit Share",
                    UNIT_COUNT: "Unit Count",
                },
            },
            majorityRuleType: {
                label: "Majority Rule Type",
                placeholder: "Select rule type",
                options: {
                    SIMPLE_MAJORITY: "Simple Majority (>50 %)",
                    QUALIFIED_MAJORITY: "Qualified Majority",
                    UNANIMITY: "Unanimity (100 %)",
                },
            },
            majorityDenominatorBasis: {
                label: "Majority Denominator Basis",
                options: {
                    VOTES_CAST: "Of votes cast",
                    ALL_VOTES: "Of all votes",
                },
            },
            majorityThreshold: {
                label: "Majority Threshold",
                errors: {
                    requiredForQualified:
                        "Required when majority rule is qualified",
                },
            },
            allowAbstain: {
                label: "Allow Abstain Options?",
                description:
                    "Enables voters to explicitly abstain from voting on questions.",
            },
            time: "Time",
        },
        thresholdPicker: {
            customLabel: "Custom fraction",
            percentLabel: "Percent",
            comparatorLabel: "Comparator",
            comparator: {
                AT_LEAST: "at least",
                STRICT_GREATER: "more than",
            },
        },
        legal: {
            tier1: {
                MAJORITY_BELOW_FLOOR:
                    "The required majority may not be set below a simple majority (more than 50 %).",
                PER_ROLLAM_QUORUM_PRESENT:
                    "A per-rollam vote may not have a quorum set.",
                PER_ROLLAM_BASIS_NOT_ALL_VOTES:
                    "A per-rollam vote must count the majority against all votes, not just votes cast.",
                ASSEMBLY_QUORUM_MISSING:
                    "An assembly record must have a quorum set.",
                ASSEMBLY_QUORUM_BELOW_FLOOR:
                    "The assembly quorum may not be set below a simple majority of all votes.",
            },
            tier3: {
                ONE_UNIT_ONE_VOTE: "one-unit-one-vote weighting",
                UNIT_COUNT_QUORUM: "unit-count quorum",
            },
            ackLabel:
                "I confirm that our association's bylaws explicitly permit: {{deviations}}",
            overrideStricterOnly:
                "An override may only make the majority rule stricter, never looser.",
        },
        documents: {
            title: "Documents",
            description:
                "Attach supporting documents (PDF, Word, Excel, images). Max 50 MB per file.",
            add: "Add document",
            uploading: "Uploading…",
            retry: "Retry",
            dismiss: "Dismiss",
            tooLarge: "The file exceeds the 50 MB limit.",
            typeNotAllowed: "This file type is not allowed.",
            limitReached: "A vote can have at most 20 documents.",
            uploadFailed: "Upload failed.",
            queued: "Queued",
            queuedHint:
                "Files will be uploaded once the vote details are saved.",
            uploadsIncomplete:
                "Some documents failed to upload. Retry or remove them to continue.",
        },
        toast: {
            createSuccess: "Vote created successfully",
            updateSuccess: "Vote updated successfully",
            error: "Failed to create vote",
            rulesetError: "Failed to configure ruleset",
            rulesetSuccess: "Ruleset configured successfully",
            scheduleSuccess: "Vote scheduled successfully",
        },
        legalValidityDisclaimer: {
            title: "Legal Validity Notice",
            description:
                "The selected settings deviate from standard statutory rules (unit share weight, all units quorum). Ensure these rules comply with your association's statutes, otherwise the vote might be legally contestable.",
        },
    },
    wizard: {
        newVote: "New vote",
        exit: "Exit",
        draft: "Draft",
        saved: "All changes saved",
        unsaved: "Unsaved changes",
        saving: "Saving…",
        railTitle: "Set up in 5 steps",
        steps: {
            mode: "Vote type",
            details: "Details",
            rules: "Voting rules",
            questions: "Questions",
            review: "Review & schedule",
        },
        note: "Your draft saves automatically as you complete each step. Owners see nothing until the vote is scheduled.",
        back: "Back",
        continue: "Continue",
        toReview: "Review",
        stepOf: "Step {{n}} of {{total}}",
        review: {
            title: "Review & schedule",
            edit: "Edit",
            scheduleTitle: "Schedule this vote?",
            scheduleCopy:
                "Once scheduled, owners are notified and the setup can no longer be edited.",
            keepDraft: "Keep as draft",
            scheduleAction: "Schedule vote",
            quorumLine: "Quorum: {{comparator}} {{threshold}}.",
            majorityLine: "Majority: {{comparator}} {{threshold}}.",
            checks: {
                VOTE_SCHEDULE_MISSING_DATES:
                    "Opening and closing dates are set",
                VOTE_SCHEDULE_IN_PAST: "Opening date is in the future",
                VOTE_SCHEDULE_INVALID_RANGE: "Closing date is after opening",
                VOTE_RULESET_REQUIRED: "Voting rules are configured",
                VOTE_MISSING_QUESTIONS: "At least one question exists",
                VOTE_QUESTION_MISSING_OPTIONS:
                    "Every question has answer options",
                SHORT_VOTING_PERIOD: "Voting period is at least 15 days",
            },
        },
    },
    list: {
        error: "Failed to load votes.",
        empty: {
            all: "No votes found.",
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
            endedOn: "Ended on ",
            noDescription: "No description provided.",
            voteRequired: "Your vote is required.",
            voteAction: "Vote",
            manageDelegation: "Manage Delegation",
            readyToVoteSubtitle: "You are eligible when voting opens.",
            alreadyDelegatedSubtitle: "You have assigned a representative.",
            scheduledSubtitle: "This vote has not started yet.",
            viewDetails: "View Details",
            alreadyDelegatedOpenSubtitle:
                "Other co-owners have chosen a representative for your units.",
            cannotVoteOpenSubtitle:
                "None of your units are eligible in this vote.",
            viewOutcomes: "View final outcomes",
            viewResults: "View Results",
            votedSubtitle: "You have already cast your ballot.",
            alreadyVotedAction: "Already Voted",
            editDraft: "Configuration is incomplete",
        },
    },
    resultsOverview: {
        empty: "No closed votings found.",
        error: "Failed to load voting results.",
    },
    outcomes: {
        APPROVED: "Approved",
        REJECTED: "Rejected",
        NOT_DECIDED: "Not decided",
        winner: "{{option}} wins",
    },
    status: {
        requiresDelegation:
            "To vote for this unit, a common representative must be authorized (by co-owners holding a majority of shares).",
        requiresDelegationSjm:
            "For a unit held in marital community property, the other spouse must also confirm the representative.",
    },
    detail: {
        backToVoting: "Voting",
        metaLine: "Opened {{opened}} · closes {{closes}} ({{relative}})",
        metaLineEnded: "Opened {{opened}} · ended {{closes}}",
        timeline: {
            startDate: "START DATE",
            endDate: "END DATE",
            notSet: "Not set",
        },
        description: {
            title: "Description",
        },
        about: {
            title: "About this vote",
        },
        actions: {
            edit: "Edit Vote",
            schedule: "Schedule Vote",
            scheduleConfirmTitle: "Schedule Vote",
            scheduleConfirmDescription:
                "Are you sure you want to schedule this vote? This action will make the vote visible to regular users and is irreversible. You will no longer be able to edit the vote details or ruleset.",
            cancel: "Cancel",
            confirm: "Yes, Schedule Vote",
            delete: "Delete Draft",
            deleteConfirmTitle: "Delete Draft Vote",
            deleteConfirmDescription:
                "Are you sure you want to delete this draft? All questions, options, and ruleset settings will be permanently removed. This action cannot be undone.",
            deleteConfirm: "Yes, Delete Draft",
            deleteSuccess: "Draft vote deleted",
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
                VOTE_WINDOW_TOO_SHORT_PER_ROLLAM:
                    "The per-rollam voting window must last at least 15 days.",
            },
        },
        documents: {
            download: "Download",
            delete: "Remove",
            empty: "No documents attached.",
        },
        questions: {
            title: "Voting Items",
        },
        statusSidebar: {
            title: "Your Voting Status",
            opensIn: "Voting starts",
            owningUnits: "OWNING UNITS",
            share: "Share:",
            statusReady: "Ready",
            statusDelegation: "Requires delegation",
            statusVoted: "Voted",
            statusDelegated: "Delegated",
            statusIneligible: "Ineligible",
            ineligibleReasons: {
                NO_REPRESENTATIVE: "No common representative was chosen.",
                MISSING_OWNERSHIP:
                    "Ownership information missing at start time.",
                ASSOCIATION_OWNED:
                    "The unit is owned by the association and has no voting right.",
            },
            manageDelegation: "Manage Delegation",
            totalPower: "Total Voting Power:",
            totalPowerVotes_one: "{{count}} vote",
            totalPowerVotes_other: "{{count}} votes",
            voteButton: "Vote",
            alreadyVotedButton: "Already Voted",
            ballotsFinal: "Ballots are final and cannot be changed.",
            help: {
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
        searchByCoOwner: "Search representatives by name",
        noCandidatesFound: "No eligible representatives found.",
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
                "A common representative is chosen by co-owners consenting by a majority of shares. Once you delegate your vote for this unit, you cannot vote personally in this specific event unless you revoke the delegation before the vote starts.",
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
    delegation: {
        coOwner: "Co-owner",
    },
    delegations: {
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
        footnote:
            "Proxies can also be recorded by the board on an owner's behalf.",
        admin: {
            title: "Record Proxy Delegation",
            description:
                "As an administrator, you can record a delegation on behalf of an owner who provided you with a physical consent form.",
            selectVote: "Select Vote",
            selectUnit: "Select Unit",
            selectOwner: "Principal",
            selectDelegate: "Proxy",
            success: "Proxy delegation recorded successfully",
            errors: {
                vote: "Select a vote",
                unit: "Select a unit",
                owner: "Select an owner",
                delegate: "Select a proxy",
            },
        },
    },
    castVote: {
        error: "Unable to load vote. Please try again.",
        votingFor: "VOTING FOR",
        voteShare: "Vote Share",
        voteShareLabel: "Vote Share",
        progress: {
            question: "Question {{current}} of {{total}}",
            completed: "Completed",
        },
        options: {
            yes: "In Favor",
            no: "Against",
            abstain: "Abstain",
        },
        navigation: {
            previous: "Previous Question",
            next: "Next Question",
            review: "Review Answers",
        },
        review: {
            title: "Review Your Vote",
            subtitle:
                "Please verify your choices before submitting. Once submitted, this action cannot be undone.",
            selectedChoices: "Selected Choices",
            editAnswers: "Edit Answers",
            submitVote: "Submit Vote",
        },
        success: {
            title: "Vote Recorded!",
            subtitle: "Your vote has been successfully recorded.",
            timestamp: "Timestamp",
            backToDashboard: "Back to dashboard",
        },
        alreadyVoted: {
            title: "Vote Successfully Recorded",
            description:
                "Your ballot has been successfully stored in our system. You can follow the progress in the vote detail.",
        },
        noUnits: {
            title: "No Units to Vote",
            description:
                "You don't have any additional units eligible to cast a vote in this specific event.",
        },
        backToDetail: "Back to Vote Detail",
    },
    results: {
        breadcrumbVoting: "Voting",
        viewResults: "View Results",
        unitCount_one: "{{count}} unit",
        unitCount_other: "{{count}} units",
        downloadAuditReport: "Download audit report",
        downloadAuditReportError: "Failed to download audit report.",
        tabs: {
            results: "Results",
            activity: "Activity",
        },
        activity: {
            empty: "No activity events to display for this vote.",
            error: "Failed to load activity.",
            expandDetails: "Show details",
            collapseDetails: "Hide details",
        },
        perRollamDenominator:
            "The majority is counted from all votes in the building.",
    },
    resultsV2: {
        participationLine:
            "Owners holding {{pct}} % of building shares took part ({{units}} of {{total}} units).",
        participationLineUnits:
            "{{pct}} % of units took part ({{units}} of {{total}} units).",
        participationExactTitle:
            "Exact: {{participationNum}}/{{participationDen}} of {{totalNum}}/{{totalDen}}",
        quorumMetLine: "Quorum of {{threshold}} % was met.",
        quorumNotMetLine:
            "Quorum of {{threshold}} % was not met — resolutions are not decided.",
        thresholdCaption:
            "Threshold: {{comparator}} {{fraction}} (base {{denominator}})",
        thresholdDenominatorShare: "{{percent}} % of shares",
        thresholdExactTitle: "Exact base: {{num}}/{{den}}",
        multipleChoice: "multiple choice",
        ranLine: "Voting ran {{from}} – {{to}} · results computed {{computed}}",
        footnote:
            "Bar percentages are shares of the whole building (or of all units for unit-counted votes); each verdict states its own basis. Majority rules are evaluated per question from its effective ruleset; quorum applies to the vote as a whole.",
        resolutionLabel: "Resolution {{index}}",
        didntVote: "Didn't vote",
        winnerChip: "winner",
        reasonApproved:
            "For received {{pct}} % of votes cast — above {{majority}} required.",
        reasonRejected:
            "For received only {{pct}} % of votes cast — below {{majority}} required.",
        reasonWinner:
            '"{{option}}" received {{pct}} % of votes cast — a majority.',
        reasonNoQuorum:
            "Only {{turnout}} % took part — below the {{threshold}} % quorum, so the resolution is not decided (even where most cast votes were in favor).",
        reasonNoMajority: "No option reached the required majority.",
    },
};
