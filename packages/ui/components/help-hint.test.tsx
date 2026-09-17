// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { HelpHint } from "./help-hint";

afterEach(cleanup);

const setup = () => {
    const user = userEvent.setup();
    render(
        <HelpHint label="How to record co-ownership">
            <p>One entry per co-owner.</p>
        </HelpHint>,
    );
    return { user, trigger: screen.getByRole("button", { name: /co-owner/i }) };
};

const hint = () => screen.queryByText("One entry per co-owner.");

describe("HelpHint", () => {
    it("opens on click, because hover does not exist on a touch screen", async () => {
        const { user, trigger } = setup();
        expect(hint()).toBeNull();

        await user.click(trigger);
        await waitFor(() => expect(hint()).not.toBeNull());
    });

    it("opens on hover, so it is found by someone already pointing at it", async () => {
        const { user, trigger } = setup();

        await user.hover(trigger);
        await waitFor(() => expect(hint()).not.toBeNull());
    });

    it("stays open while the pointer travels to the panel", async () => {
        const { user, trigger } = setup();
        await user.hover(trigger);
        await waitFor(() => expect(hint()).not.toBeNull());

        // Leaving the trigger only schedules the close; entering the panel
        // cancels it, or the hint would blink shut mid-sentence.
        await user.unhover(trigger);
        await user.hover(hint()!);

        await new Promise((resolve) => setTimeout(resolve, 200));
        expect(hint()).not.toBeNull();
    });

    it("opens on keyboard focus and carries an accessible name", async () => {
        const { user, trigger } = setup();
        expect(trigger.getAttribute("aria-label")).toBe(
            "How to record co-ownership",
        );

        await user.tab();
        await waitFor(() => expect(hint()).not.toBeNull());
    });

    it("never sets title, which would paint a second, native bubble", () => {
        const { trigger } = setup();
        expect(trigger.hasAttribute("title")).toBe(false);
    });

    it("shows the label beside the icon and lets it name the button", () => {
        render(
            <HelpHint showLabel label="How to record co-ownership">
                <p>One entry per co-owner.</p>
            </HelpHint>,
        );

        const labelled = screen.getByRole("button", { name: /co-owner/i });
        expect(labelled.textContent).toContain("How to record co-ownership");
        // The visible text is the accessible name; a duplicate aria-label
        // would override it with the same words.
        expect(labelled.hasAttribute("aria-label")).toBe(false);
    });
});
