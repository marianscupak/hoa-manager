export const voting = {
    hub: {
        title: "Voting",
        newVote: "New vote",
        tabs: {
            active: "Active & upcoming",
            results: "Results",
            delegations: "Representation",
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
        ofAllVotes: "of the voting shares were present",
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
                        errors: {
                            required: "Question wording is required",
                        },
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
                    errors: {
                        required: "Option text is required",
                        atLeastTwo:
                            "A multiple-choice question needs at least two options.",
                    },
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
            meetingDate: {
                label: "Meeting date and time",
                description: "When was the meeting held?",
            },
            scheduledFrom: {
                label: "Scheduled From",
                description: "When should the vote automatically open?",
            },
            scheduledTo: {
                label: "Scheduled To",
                description: "When should the vote automatically close?",
                errors: {
                    beforeStart:
                        "The closing date must come after the opening date.",
                    tooShortPerRollam:
                        "A per rollam vote must run for at least 15 days. Move the closing date further out.",
                },
            },
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
            customPlaceholder: "E.g. 3/5 or 60 %",
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
            description: "Attach anything owners should read before they vote.",
            dropzone: "Drop documents here or browse",
            dropzoneHint: "PDF, Word, Excel or images · max 50 MB per file",
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
    assemblyRecord: {
        entry: {
            title: "Assembly record",
            prompt: "The meeting has happened. Enter the ballots you collected and publish the record — owners see it only then.",
            action: "Record the assembly",
        },
        loadError: "Could not load the assembly record.",
        noUnits: "This association has no units.",
        header: {
            title: "Assembly record · {{title}}",
            heldOn: "Meeting held {{date}} · entering the collected ballots",
            noDate: "No meeting date recorded",
            exit: "Exit",
            recording: "Recording",
            hidden: "Hidden from owners",
        },
        attendance: {
            ofAllVotes: "of all votes present",
            quorate: "Quorate",
            belowQuorum: "Below quorum",
            presentOf: "{{present}} of {{total}} units present",
            absentAndNoOwner: "{{absent}} absent · {{ineligible}} cannot vote",
            quorumRule: "Quorum needs more than half of all votes",
            sharesOnRecord: "Shares on record: {{num}}/{{den}}",
        },
        tally: {
            eyebrow: "Running count",
            entered: "{{entered}} of {{present}} present units entered",
            units_one: "{{count}} unit",
            units_other: "{{count}} units",
            footnoteShare: "Board only · shares of all votes in the building · provisional until published",
            footnoteUnits: "Board only · provisional until published",
        },
        roster: {
            search: "Search unit or owner…",
            noOwner: "No registered owner",
            showing: "Showing {{shown}} of {{total}} units",
            filters: {
                all: "All",
                todo: "To enter",
                present: "Present",
                absent: "Not present",
            },
            marker: {
                toEnter: "to enter",
                absent: "absent",
                ineligible: "cannot vote",
                unset: "not set",
                complete: "",
            },
        },
        unit: {
            eyebrow: "Unit {{index}} of {{total}}",
            share: "share {{num}}/{{den}} ({{percent}} of all votes)",
            coOwned: "Co-owned",
            prev: "Previous unit",
            next: "Next unit",
            attendanceQuestion: "Was the unit represented at the meeting?",
            present: "Present",
            presentHint: "Counts toward quorum and the majority.",
            presentNeedsVoter: "Choose who voted for the unit first.",
            absent: "Absent",
            absentHint: "No vote recorded for this unit.",
            voterQuestion: "Who voted for the unit?",
            voterOwner: "owner",
            voterProxy: "Someone else, by power of attorney",
            voterProxyPlaceholder: "Name of the person who voted",
            resolution: "Resolution {{index}}",
            answersIncomplete: "{{count}} resolutions still to answer — the ballot is saved once every one is filled in.",
            answersFootnote: "Enter what the minutes record for this unit. A present unit that did not vote on a resolution is recorded as abstaining.",
            absentExplainer: "Marked absent — nothing to enter. The majority is counted from the votes of those present, so this unit's {{percent}} is left out of it. The same share still counts toward quorum.",
            ineligible: {
                MISSING_OWNERSHIP: "The unit has no registered owner. It counts toward quorum but cannot vote — add an owner in the unit register.",
                ASSOCIATION_OWNED: "The association owns this unit, so it does not vote and does not count toward quorum.",
            },
        },
        footer: {
            autosave: "Saved as you go",
            stillToEnter: "{{count}} present units still to enter",
            allEntered: "all present units entered",
            nextToEnter: "Next unit to enter",
            review: "Review & publish",
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
            startRecordingAction: "Start recording",
            quorumLine: "Quorum: {{comparator}} {{threshold}}.",
            majorityLine: "Majority: {{comparator}} {{threshold}}.",
            checks: {
                VOTE_SCHEDULE_MISSING_DATES:
                    "Opening and closing dates are set",
                VOTE_SCHEDULE_IN_PAST: "Opening date is in the future",
                VOTE_RULESET_REQUIRED: "Voting rules are configured",
                VOTE_MISSING_QUESTIONS: "At least one question exists",
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
            manageDelegation: "Manage representation",
            readyToVoteSubtitle: "You are eligible when voting opens.",
            alreadyDelegatedSubtitle: "You have chosen a common representative.",
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
            "To vote for this unit, a common representative must be named (by co-owners holding a majority of shares).",
        requiresDelegationSjm:
            "For a unit held in marital community property, the other spouse must also confirm the representative.",
        readyCanDelegate:
            "Can't vote in person? Arrange representation before the vote opens.",
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
                VOTE_QUESTION_MISSING_TITLE:
                    'Question "{{param}}" needs its wording filled in.',
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
            statusDelegation: "Requires a representative",
            statusVoted: "Voted",
            statusProxy: "Representing",
            statusProxyHint: "An owner chose you to vote for this unit.",
            statusDelegated: "Represented",
            statusIneligible: "Ineligible",
            ineligibleReasons: {
                NO_REPRESENTATIVE: "No common representative was chosen.",
                MISSING_OWNERSHIP:
                    "Ownership information missing at start time.",
                ASSOCIATION_OWNED:
                    "The unit is owned by the association and has no voting right.",
            },
            manageDelegation: "Manage representation",
            arrangeDelegation: "Arrange representation",
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
        risk: {
            noRepresentative: {
                title: "This would leave the unit without a representative",
                description:
                    "Owners of more than half the unit have to agree on the same person, and after this change nobody would have that. If the unit is owned by a married couple, your spouse needs to confirm the same person before the vote opens.",
            },
        },
        title: "Name a representative",
        backToVote: "Back to vote detail",
        votingEvent: "Voting Event",
        cancelExisting: "Cancel representation",
        selectUnit: "Select Unit",
        whoWillRepresent: "Who will represent you?",
        searchByCoOwner: "Search representatives by name",
        noCandidatesFound: "No eligible representatives found.",
        noSelectableUnits:
            "You have already named a representative for all your units in this event.",
        assignedToYou: "Assigned to you",
        alreadyDelegated: "Representative already named",
        confirmButton: "Confirm representation",
        confirming: "Confirming...",
        terms: 'By clicking "Confirm representation", you agree to the HOA Portal digital voting terms and conditions.',
        notice: {
            title: "Important Notice",
            description:
                "A common representative is chosen by co-owners consenting by a majority of shares. Once you name a representative for this unit, you cannot vote personally in this specific event unless you revoke the representation before the vote starts.",
        },
        summary: {
            title: "Representation summary",
            unit: "Unit",
            voteShare: "Vote Share",
            delegate: "Representative",
            notSelected: "Not selected",
        },
        modal: {
            title: "Confirm representation",
            description:
                "Please review the representation details before confirming.",
            warning:
                "By confirming, you authorize the selected representative to vote on your behalf for this unit. You can revoke this before the voting starts.",
            toast: {
                success: "Representation created successfully",
                error: "Failed to create representation",
            },
            delegateLabel: "REPRESENTATIVE",
            delegateSubtext: "Person voting for you",
            unitLabel: "UNIT",
            unitSubtext: "Property Asset",
            eventLabel: "VOTING EVENT",
            eventSubtext: "Agenda Item",
            revocableTitle: "Revocable action",
            revocableDescription:
                "You can cancel this representation via your dashboard at any time before the vote begins.",
            terms: "By proceeding, you acknowledge that this representation complies with the statutes of the HOA. The representative listed above will vote on this agenda item on your behalf.",
            allowAction: "Allow person to vote on my behalf",
        },
    },
    delegation: {
        coOwner: "Co-owner",
    },
    delegations: {
        tabs: {
            myDelegations: "My representation",
            recordProxy: "Record representation (Admin)",
        },
        table: {
            unit: "Unit",
            vote: "Vote",
            from: "Owner",
            to: "Representative",
            date: "Recorded On",
            revoke: "Revoke",
            revokeSuccess: "Representation revoked successfully",
            searchPlaceholder: "Search representation",
            range: "Showing {{from}}–{{to}} of {{total}} representations",
            count_one: "{{count}} representation",
            count_other: "{{count}} representations",
        },
        empty: {
            title: "No representation found",
            description:
                "You haven't named anyone as your representative yet, and nobody has named you as theirs.",
            all: "You have no proxies yet. Use the button above to grant one before the vote opens.",
            filtered: "No representation for the selected vote.",
            search: "No representation matches your search.",
        },
        create: {
            button: "Name a representative",
            noVotes: "No vote is open for naming a representative right now",
        },
        filter: {
            vote: "Filter by Vote",
            allVotes: "All Scheduled Votes",
        },
        footnote:
            "Proxies can also be recorded by the board on an owner's behalf.",
        admin: {
            title: "Record representation",
            description:
                "As an administrator, you can record a representation on behalf of an owner who provided you with a physical consent form.",
            selectVote: "Select Vote",
            selectUnit: "Select Unit",
            selectOwner: "Owner",
            selectDelegate: "Representative",
            success: "Representation recorded successfully",
            errors: {
                vote: "Select a vote",
                unit: "Select a unit",
                owner: "Select an owner",
                delegate: "Select a representative",
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
        confirmSubmit: {
            title: "Submit your vote?",
            description_one:
                "Your ballot for {{count}} unit will be submitted. Ballots cannot be changed afterwards.",
            description_other:
                "Your ballots for {{count}} units will be submitted. Ballots cannot be changed afterwards.",
            confirm: "Submit vote",
            confirming: "Submitting…",
        },
        success: {
            title: "Vote recorded",
            subtitle:
                "Your ballot has been stored. You can follow the progress in the vote detail.",
            timestamp: "Recorded at",
        },
        alreadyVoted: {
            title: "You have already voted",
            description:
                "Your ballot for this vote is recorded. You can follow the progress in the vote detail.",
        },
        noUnits: {
            title: "No Units to Vote",
            description:
                "You don't have any additional units eligible to cast a vote in this specific event.",
        },
        backToDetail: "Back to Vote Detail",
    },
    paperBallot: {
        exit: "Exit",
        headerTitle: "Record paper ballot",
        headerSubtitle: "On behalf of an owner, from a signed paper ballot",
        closesOn: "closes {{date}}",
        railTitle: "Record in 4 steps",
        railNote:
            "The signed paper ballot stays the authoritative document. Attach the scan here and file the original with the association records.",
        steps: {
            unit: "Choose unit",
            ballot: "Ballot & voter",
            answers: "Enter answers",
            review: "Review & record",
        },
        back: "Back",
        chooseUnit: {
            title: "Whose ballot are you recording?",
            subtitle:
                "Only units that haven't voted yet can have a paper ballot recorded. Owners can still vote in the app until you record theirs.",
            turnout: "{{voted}} of {{total}} units have voted",
            searchPlaceholder: "Search unit or owner…",
            columns: {
                unit: "Unit",
                share: "Share",
                status: "Status",
                action: "Action",
            },
            status: {
                votedInApp: "In app · {{date}}",
                votedOnPaper: "Paper · {{date}}",
                voted: "Voted",
                notVoted: "Not voted",
                ineligible: "Not eligible",
            },
            ineligibleReason: {
                NO_REPRESENTATIVE: "No common representative",
                MISSING_OWNERSHIP: "No registered owner",
                ASSOCIATION_OWNED: "Owned by the association",
            },
            record: "Record paper ballot",
            castInApp: "Cast in app",
            range: "Showing {{from}}–{{to}} of {{total}} units",
            count: "Showing {{count}} units",
            empty: "This vote has no units.",
            noMatch: "No unit matches your search.",
            footnote:
                "Recording a paper ballot is final for the unit — the owner can no longer vote in the app. Every recording is visible in the vote's audit log.",
        },
        ballot: {
            title: "Attach the ballot for {{unit}}",
            subtitle: "{{owners}} · share {{share}}",
            uploadLabel: "Scanned ballot",
            dropzone: "Drop the scanned ballot here or browse",
            dropzoneHint: "PDF, JPG or PNG · max 20 MB",
            uploading: "Uploading…",
            attached: "Attached",
            remove: "Remove",
            signerLabel: "Who signed the ballot?",
            ownerRole: "Owner · owns {{share}}",
            representative: "Common representative",
            coOwnedHint:
                "This unit is co-owned — the ballot should be signed by the common representative.",
            noOwners:
                "No current owner is on record for this unit, so a paper ballot can't be recorded. Check the unit's ownership.",
            auditNote:
                "This is recorded in the activity log as a ballot recorded on the owner's behalf — with your name, the signer and the attached scan. The board can see it in the vote's activity.",
            continue: "Continue to answers",
            tooLarge: "That file is larger than 20 MB.",
            wrongType: "Attach a PDF, JPG or PNG.",
        },
        answers: {
            context:
                "Transcribing the paper ballot for {{unit}} · signed by {{signer}}",
            change: "Change",
            progress: "Question {{current}} of {{total}}",
            done: "{{percent}}% done",
            caption: "Enter exactly what is marked on the paper ballot.",
            next: "Next question",
            review: "Review ballot",
        },
        exitConfirm: {
            title: "Discard this recording?",
            description:
                "The attached scan and any answers you entered will be discarded. The ballot will not be recorded.",
            confirm: "Discard",
        },
        review: {
            title: "Review before recording",
            subtitle:
                "Check every answer against the paper ballot one more time.",
            signedBy: "Signed by {{signer}}",
            warning:
                "Recorded ballots are final and cannot be changed. If an answer doesn't match the paper, go back and correct it now.",
            confirm:
                "I checked that the answers above match the signed paper ballot for {{unit}}.",
            submit: "Record ballot for {{unit}}",
        },
        done: {
            title: "Ballot for {{unit}} recorded",
            body: "Its share now counts toward quorum. The activity log shows the ballot as recorded on the owner's behalf — by {{actor}}, signed by {{signer}}.",
            recordedAt: "Recorded at",
            another: "Record another",
            backToVote: "Back to vote",
        },
        alreadyCast: "This unit has already voted — nothing was recorded.",
        boardTools: {
            title: "Board tools",
            prompt: "Record a ballot an owner handed in on paper.",
            action: "Record paper ballot",
        },
    },
    liveResults: {
        back: "Voting · {{title}}",
        title: "Live results",
        subtitle:
            "Voting is open until {{date}} · standings update as ballots come in",
        roleChip: {
            board: "Board view · full detail",
            owner: "Owner view · participation only",
        },
        turnout: {
            caption: "of shares voted",
            captionUnits: "of units voted",
            headline: "{{voted}} of {{total}} units have cast a ballot",
            quorumReached: "Quorum reached",
            quorumNotReached: "Quorum not reached yet",
            marker: "{{threshold}} % · quorum",
            excluded_one:
                "{{count}} unit is owned by the association and is not counted in the total.",
            excluded_other:
                "{{count}} units are owned by the association and are not counted in the total.",
        },
        tally: {
            title: "Running tally",
            note: "Board only · provisional until close",
            empty: "No ballots yet.",
            units_one: "{{count}} unit",
            units_other: "{{count}} units",
        },
        note: {
            board: "You can see individual ballots because you are a board member. Owners only see whether a unit has voted.",
            owner: "How each unit voted stays sealed until voting closes on {{date}}. Until then you can only see whether a unit has cast its ballot.",
        },
        filters: { all: "All", voted: "Voted", notVoted: "Not voted" },
        searchPlaceholder: {
            board: "Search unit or owner…",
            owner: "Search unit…",
        },
        columns: { unit: "Unit", share: "Share", status: "Status" },
        status: {
            voted: "Voted",
            notVoted: "Not voted",
            needsDelegation: "No common representative",
            ineligible: "Not eligible",
            inApp: "In app · {{date}}",
            onPaper: "Paper ballot · {{date}}",
            onPaperRecordedBy: "Paper ballot · {{date}} · recorded by {{name}}",
            ineligibleReason: {
                MISSING_OWNERSHIP: "No owner on record",
                ASSOCIATION_OWNED: "Owned by the association",
                NO_REPRESENTATIVE: "No common representative",
            },
        },
        pill: { yours: "Yours", proxy: "By representative" },
        answers: {
            none: "—",
            expand: "Show answers for unit {{unitNo}}",
            collapse: "Hide answers for unit {{unitNo}}",
        },
        showing: "Showing {{shown}} of {{total}} units",
        empty: "This vote has no units.",
        noMatch: "No units match your search.",
        entry: {
            title: "Live results",
            copy: "{{voted}} of {{total}} units have cast a ballot so far.",
            copyQuorum:
                "{{voted}} of {{total}} units have cast a ballot so far — quorum reached.",
            copyQuorumNotReached:
                "{{voted}} of {{total}} units have cast a ballot so far — quorum not reached yet.",
            action: "See who has voted",
        },
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
