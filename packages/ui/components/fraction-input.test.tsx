// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FractionInput } from "./fraction-input";

afterEach(cleanup);

const setup = (value: { num: number; den: number } | null = null) => {
    const onChange = vi.fn();
    const view = render(<FractionInput value={value} onChange={onChange} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    return { ...view, onChange, input, user: userEvent.setup() };
};

describe("FractionInput", () => {
    it("does not emit while the user is still typing", async () => {
        const { user, input, onChange } = setup();
        await user.type(input, "3200/10000");
        expect(onChange).not.toHaveBeenCalled();
    });

    it("emits the typed fraction exactly as typed on blur", async () => {
        const { user, input, onChange } = setup();
        await user.type(input, "3200/10000");
        await user.tab();
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith({ num: 3200, den: 10000 });
        expect(input.value).toBe("3200/10000");
    });

    it("emits on Enter without waiting for blur", async () => {
        const { user, input, onChange } = setup();
        await user.type(input, "1/2{Enter}");
        expect(onChange).toHaveBeenCalledWith({ num: 1, den: 2 });
    });

    it("keeps invalid text visible, emits null and marks the field invalid", async () => {
        const { user, input, onChange } = setup();
        await user.type(input, "abc");
        await user.tab();
        expect(onChange).toHaveBeenCalledWith(null);
        expect(input.value).toBe("abc");
        expect(input.getAttribute("aria-invalid")).toBe("true");
    });

    it("treats a cleared field as empty, not invalid", async () => {
        const { user, input, onChange } = setup({ num: 1, den: 2 });
        expect(input.value).toBe("1/2");
        await user.clear(input);
        await user.tab();
        expect(onChange).toHaveBeenCalledWith(null);
        expect(input.getAttribute("aria-invalid")).not.toBe("true");
    });

    it("shows a value set from outside, such as a preset chip", () => {
        const { rerender, input } = setup(null);
        rerender(
            <FractionInput value={{ num: 3, den: 4 }} onChange={vi.fn()} />,
        );
        expect(input.value).toBe("3/4");
    });
});
