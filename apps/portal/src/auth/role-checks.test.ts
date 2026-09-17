import { describe, expect, it } from "vitest";

import { Role } from "@/auth/roles";

import { isAdminOrBoard, isAdminView } from "./role-checks";

describe("isAdminOrBoard", () => {
    // What the unit register and the people list hand out — the actions that
    // change the record — turns on this one predicate.
    it.each([Role.ADMIN, Role.BOARD_MEMBER])("lets %s manage", (role) => {
        expect(isAdminOrBoard([role])).toBe(true);
    });

    it("keeps an auditor out: they read the register, they do not change it", () => {
        expect(isAdminOrBoard([Role.AUDITOR])).toBe(false);
    });

    it("keeps a unit owner out", () => {
        expect(isAdminOrBoard([Role.UNIT_OWNER])).toBe(false);
    });

    it("answers on any one of several roles", () => {
        expect(isAdminOrBoard([Role.UNIT_OWNER, Role.BOARD_MEMBER])).toBe(true);
    });

    it("says no when the roles are not loaded yet", () => {
        // The atom is empty on the first render after a tenant switch; a
        // truthy answer there would flash the management actions.
        expect(isAdminOrBoard(undefined)).toBe(false);
        expect(isAdminOrBoard([])).toBe(false);
    });
});

describe("isAdminView", () => {
    it("adds the auditor, who may see what the board sees", () => {
        expect(isAdminView([Role.AUDITOR])).toBe(true);
        expect(isAdminView([Role.UNIT_OWNER])).toBe(false);
        expect(isAdminView(undefined)).toBe(false);
    });
});
