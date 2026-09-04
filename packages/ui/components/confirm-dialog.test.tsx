// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConfirmDialog, type ConfirmDialogProps } from "./confirm-dialog";

afterEach(cleanup);

const setup = (props: Partial<ConfirmDialogProps> = {}) => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
        <ConfirmDialog
            open
            onOpenChange={onOpenChange}
            title="Submit your vote?"
            description="Ballots cannot be changed afterwards."
            confirmLabel="Submit vote"
            cancelLabel="Cancel"
            onConfirm={onConfirm}
            {...props}
        />,
    );
    return { onConfirm, onOpenChange, user: userEvent.setup() };
};

const button = (name: string) =>
    screen.getByRole("button", { name }) as HTMLButtonElement;

describe("ConfirmDialog", () => {
    it("styles the confirm button as destructive by default", () => {
        setup();
        expect(button("Submit vote").className).toContain("bg-destructive");
    });

    it("honours a non-destructive confirmVariant", () => {
        setup({ confirmVariant: "default" });
        const confirm = button("Submit vote");
        expect(confirm.className).toContain("bg-primary");
        expect(confirm.className).not.toContain("bg-destructive");
    });

    it("confirms on click and cancels via onOpenChange", async () => {
        const { user, onConfirm, onOpenChange } = setup();
        await user.click(button("Submit vote"));
        expect(onConfirm).toHaveBeenCalledTimes(1);

        await user.click(button("Cancel"));
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("disables both buttons and swaps the label while confirming", () => {
        setup({ confirming: true, confirmingLabel: "Submitting…" });
        expect(button("Submitting…").disabled).toBe(true);
        expect(button("Cancel").disabled).toBe(true);
    });
});
