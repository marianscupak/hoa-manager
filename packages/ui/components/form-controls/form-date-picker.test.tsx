// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { useForm } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Form } from "../form";
import { FormDatePicker } from "./form-date-picker";

afterEach(cleanup);

function Harness({
    initial,
    min,
    onChange,
}: {
    initial: Date | null;
    min?: Date;
    onChange: (value: Date | null) => void;
}) {
    const form = useForm<{ date: Date | null }>({
        defaultValues: { date: initial },
    });
    const value = form.watch("date");
    React.useEffect(() => {
        onChange(value);
    }, [value, onChange]);
    return (
        <Form {...form}>
            <FormDatePicker name="date" label="Platné od" min={min} />
        </Form>
    );
}

const setup = (initial: Date | null, min?: Date) => {
    const onChange = vi.fn();
    render(<Harness initial={initial} min={min} onChange={onChange} />);
    return { onChange, user: userEvent.setup() };
};

describe("FormDatePicker", () => {
    it("shows the selected day as d. M. yyyy", () => {
        setup(new Date(2026, 9, 1));
        const trigger = screen.getByRole("button", { name: /Platné od/ });
        expect(trigger.textContent).toContain("1. 10. 2026");
    });

    it("opens a calendar and commits the clicked day at local midnight", async () => {
        const { user, onChange } = setup(new Date(2026, 9, 1));
        await user.click(screen.getByRole("button", { name: /Platné od/ }));
        await user.click(screen.getByText("15"));

        const last = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0] as Date;
        expect(last).toEqual(new Date(2026, 9, 15));
    });

    it("keeps days before min unselectable", async () => {
        const { user, onChange } = setup(
            new Date(2026, 9, 10),
            new Date(2026, 9, 5),
        );
        await user.click(screen.getByRole("button", { name: /Platné od/ }));
        await user.click(screen.getByText("3"));

        const last = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0] as Date;
        expect(last).toEqual(new Date(2026, 9, 10));
    });
});
