// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Form } from "../form";
import { FormCombobox } from "./form-combobox";

afterEach(cleanup);

const OPTIONS = [
    { label: "Marian Ščupák", value: "o1" },
    { label: "Jana Nováková", value: "o2" },
    { label: "Bytové družstvo Kotlářská", value: "o3" },
];

function Harness({ onCreate }: { onCreate?: (query: string) => void }) {
    const form = useForm({ defaultValues: { owner: "" } });
    return (
        <Form {...form}>
            <FormCombobox
                name="owner"
                label="Owner"
                placeholder="Select an owner"
                searchPlaceholder="Search owners"
                emptyMessage="No owner found"
                options={OPTIONS}
                createLabel={(q) =>
                    q ? `Create "${q}"` : "Create someone new"
                }
                onCreate={onCreate}
            />
            <output>{form.watch("owner")}</output>
        </Form>
    );
}

// The trigger is the only button on screen, and its accessible name comes
// from the field label rather than its own text.
const trigger = () => screen.getByRole("button");

const openList = async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(trigger());
    return user;
};

describe("FormCombobox", () => {
    it("narrows the list as you type and writes the pick to the form", async () => {
        const user = await openList();

        await user.type(screen.getByRole("combobox"), "nov");

        expect(screen.getAllByRole("option")).toHaveLength(1);
        await user.click(screen.getByRole("option", { name: /Nováková/ }));

        expect(screen.getByRole("status").textContent).toBe("o2");
        expect(trigger().textContent).toContain("Jana Nováková");
    });

    it("matches without diacritics, so a plain keyboard finds a Czech name", async () => {
        const user = await openList();

        await user.type(screen.getByRole("combobox"), "scupak");

        const options = screen.getAllByRole("option");
        expect(options).toHaveLength(1);
        expect(options[0].textContent).toContain("Ščupák");
    });

    it("selects with the arrow keys and Enter", async () => {
        const user = await openList();

        await user.keyboard("{ArrowDown}{Enter}");

        expect(screen.getByRole("status").textContent).toBe("o2");
    });

    it("hands the typed text to onCreate", async () => {
        const onCreate = vi.fn();
        const user = userEvent.setup();
        render(<Harness onCreate={onCreate} />);
        await user.click(trigger());

        await user.type(screen.getByRole("combobox"), "  Petr Svoboda  ");
        await user.click(screen.getByRole("option", { name: /^Create/ }));

        expect(onCreate).toHaveBeenCalledWith("Petr Svoboda");
        // Nothing is selected by creating — the host decides what the new
        // record is and sets the field once it exists.
        expect(screen.getByRole("status").textContent).toBe("");
    });

    it("shows the create row before anything is typed", async () => {
        const onCreate = vi.fn();
        const user = userEvent.setup();
        render(<Harness onCreate={onCreate} />);
        await user.click(trigger());

        const options = screen.getAllByRole("option");
        expect(options).toHaveLength(OPTIONS.length + 1);
        expect(options[options.length - 1].textContent).toContain(
            "Create someone new",
        );

        await user.click(
            screen.getByRole("option", { name: /Create someone new/ }),
        );
        expect(onCreate).toHaveBeenCalledWith("");
    });

    it("offers to create even while the query still matches something", async () => {
        const onCreate = vi.fn();
        const user = userEvent.setup();
        render(<Harness onCreate={onCreate} />);
        await user.click(trigger());

        await user.type(screen.getByRole("combobox"), "Jana");

        expect(screen.getByRole("option", { name: /Nováková/ })).toBeDefined();
        expect(screen.getByRole("option", { name: /^Create/ })).toBeDefined();
    });

    it("offers only the create row when the search finds nobody", async () => {
        // The state the create action exists for: someone looked for an owner
        // who isn't there yet.
        const onCreate = vi.fn();
        const user = userEvent.setup();
        render(<Harness onCreate={onCreate} />);
        await user.click(trigger());

        await user.type(screen.getByRole("combobox"), "Petr");

        const options = screen.getAllByRole("option");
        expect(options).toHaveLength(1);
        expect(options[0].textContent).toContain('Create "Petr"');
        expect(screen.queryByText("No owner found")).toBeNull();
    });

    it("keeps the create row out of the scrolling area", async () => {
        // Pinned inside the list with `position: sticky`, the create row
        // covered whatever was scrolled underneath it, so the last owner
        // could be neither read nor clicked.
        const user = userEvent.setup();
        render(<Harness onCreate={vi.fn()} />);
        await user.click(trigger());

        const listbox = screen.getByRole("listbox");
        const createRow = screen
            .getByText("Create someone new")
            .closest('[role="option"]');
        const lastOption = screen
            .getAllByRole("option")
            .find((row) => row.textContent?.includes("Bytové družstvo"));

        expect(createRow).toBeTruthy();
        expect(lastOption).toBeTruthy();
        expect(listbox.contains(createRow!)).toBe(true);

        // The owners scroll; the create row sits outside whatever scrolls,
        // so nothing can end up beneath it.
        const scroller = lastOption!.parentElement!;
        expect(scroller.className).toContain("overflow-y-auto");
        expect(scroller.contains(createRow!)).toBe(false);
        expect(createRow!.className).not.toContain("sticky");
    });

    it("says so when nothing matches and there is nothing to create", async () => {
        const user = await openList();

        await user.type(screen.getByRole("combobox"), "zzz");

        expect(screen.queryAllByRole("option")).toHaveLength(0);
        expect(screen.getByText("No owner found")).toBeDefined();
    });
});
