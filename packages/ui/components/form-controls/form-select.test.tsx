// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { afterEach, describe, expect, it } from "vitest";

import { Form } from "../form";
import { FormSelect } from "./form-select";

afterEach(cleanup);

const OPTIONS = [
    { label: "Votes cast", value: "VOTES_CAST" },
    { label: "All votes", value: "ALL_VOTES" },
];

function Harness() {
    const form = useForm({ defaultValues: { basis: "VOTES_CAST" } });
    return (
        <Form {...form}>
            <FormSelect name="basis" label="Basis" options={OPTIONS} />
            <button
                type="button"
                onClick={() => form.setValue("basis", "ALL_VOTES")}
            >
                derive
            </button>
        </Form>
    );
}

describe("FormSelect", () => {
    it("shows a value the form writes programmatically", async () => {
        render(<Harness />);
        const trigger = screen.getByRole("combobox");
        expect(trigger.textContent).toContain("Votes cast");

        await userEvent.setup().click(screen.getByText("derive"));

        expect(trigger.textContent).toContain("All votes");
    });
});
