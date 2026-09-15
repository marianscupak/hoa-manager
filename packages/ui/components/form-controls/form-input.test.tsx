// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { afterEach, describe, expect, it } from "vitest";

import { Form } from "../form";
import { FormInput } from "./form-input";

afterEach(cleanup);

function Harness() {
    const form = useForm({ defaultValues: { password: "" } });
    return (
        <Form {...form}>
            <FormInput
                name="password"
                label="Password"
                type="password"
                revealLabel="Show password"
                hideLabel="Hide password"
            />
            <FormInput name="email" label="Email" type="email" />
        </Form>
    );
}

describe("FormInput", () => {
    it("lets the user reveal and re-hide what they typed into a password field", async () => {
        const user = userEvent.setup();
        render(<Harness />);
        const password = screen.getByLabelText("Password");

        await user.type(password, "hunter2");
        expect(password).toHaveProperty("type", "password");

        await user.click(screen.getByRole("button", { name: "Show password" }));
        expect(password).toHaveProperty("type", "text");
        expect(password).toHaveProperty("value", "hunter2");

        await user.click(screen.getByRole("button", { name: "Hide password" }));
        expect(password).toHaveProperty("type", "password");
    });

    it("leaves other input types without a reveal toggle", () => {
        render(<Harness />);

        expect(screen.getAllByRole("button")).toHaveLength(1);
    });
});
