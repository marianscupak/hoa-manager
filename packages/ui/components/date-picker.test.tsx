// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DatePicker } from "./date-picker";

afterEach(cleanup);

const setup = (
    props: Partial<React.ComponentProps<typeof DatePicker>> = {},
) => {
    const onChange = vi.fn();
    render(
        <DatePicker
            value={props.value ?? new Date(2026, 9, 1)}
            onChange={onChange}
            aria-label="Platné od"
            {...props}
        />,
    );
    return { onChange, user: userEvent.setup() };
};

describe("DatePicker", () => {
    it("shows the selected day as d. M. yyyy", () => {
        setup();
        expect(
            screen.getByRole("button", { name: /Platné od/ }).textContent,
        ).toContain("1. 10. 2026");
    });

    it("commits the clicked day at local midnight", async () => {
        const { user, onChange } = setup();
        await user.click(screen.getByRole("button", { name: /Platné od/ }));
        await user.click(screen.getByText("15"));

        expect(onChange).toHaveBeenCalledWith(new Date(2026, 9, 15));
    });

    it("keeps days before min unselectable", async () => {
        const { user, onChange } = setup({
            value: new Date(2026, 9, 10),
            min: new Date(2026, 9, 5),
        });
        await user.click(screen.getByRole("button", { name: /Platné od/ }));
        await user.click(screen.getByText("3"));

        expect(onChange).not.toHaveBeenCalled();
    });

    it("shows the placeholder when there is no value", () => {
        setup({ value: null, placeholder: "Vyberte datum" });
        expect(
            screen.getByRole("button", { name: /Platné od/ }).textContent,
        ).toContain("Vyberte datum");
    });

    it("cannot be opened while disabled", async () => {
        // The katastr import disables the field while a preview or an apply
        // is in flight; a native input got that for free.
        const { user } = setup({ disabled: true });
        const trigger = screen.getByRole("button", { name: /Platné od/ });

        expect((trigger as HTMLButtonElement).disabled).toBe(true);
        await user.click(trigger);

        expect(screen.queryByRole("grid")).toBeNull();
    });
});
