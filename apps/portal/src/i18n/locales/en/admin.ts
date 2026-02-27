export default {
    owners: {
        title: "Owners",
        description: "Manage property owners in your community.",
        addOwner: "Add Owner",
        empty: "No owners found.",
        table: {
            displayName: "Display Name",
            userAccount: "User Account",
            linked: "Linked",
            unlinked: "Unlinked",
        },
        create: {
            title: "Add Owner",
            description:
                "Create a new property owner profile. This owner can later be linked to a user account.",
            displayNameLabel: "Display Name",
            displayNamePlaceholder: "E.g. John Doe or ACME Corp.",
            submit: "Create Owner",
            submitting: "Creating...",
            success: "Owner created successfully",
            error: "Failed to create owner",
            required: "Display name is required",
        },
    },
    units: {
        title: "Units",
        description: "Manage the units in your community.",
        addUnit: "Add Unit",
        empty: "No units have been added yet.",
        table: {
            unitNumber: "Unit Number",
            buildingShare: "Building Share",
        },
        create: {
            title: "Add Unit",
            description:
                "Create a new property unit and assign its building share (voting weight).",
            unitNoLabel: "Unit Number / Label",
            unitNoPlaceholder: "E.g. A-101 or Garage 1",
            buildingShareLabel: "Building Share",
            buildingSharePlaceholder: "E.g. 0.05 (for 5%)",
            submit: "Create Unit",
            submitting: "Creating...",
            success: "Unit created successfully",
            error: "Failed to create unit",
            unitNoRequired: "Unit number is required",
            buildingShareRequired: "Must be a valid positive decimal number",
        },
    },
} as const;
