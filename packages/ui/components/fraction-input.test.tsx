// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FractionInput } from "./fraction-input";

// The shared package has no i18next instance of its own, and the only thing
// FractionInput asks of one is three aria-labels and the current language
// (which decides the decimal separator). Stubbing it keeps the test free of
// an i18n bootstrap while still exercising the Czech comma path.
const labels: Record<string, string> = {
    "common:fractionInput.numerator": "Numerator",
    "common:fractionInput.denominator": "Denominator",
    "common:fractionInput.percent": "Percent",
};
let language = "en";

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => labels[key] ?? key,
        i18n: {
            get language() {
                return language;
            },
        },
    }),
}));

beforeEach(() => {
    language = "en";
});
afterEach(cleanup);

type Value = { num: number; den: number } | null;

const setup = (
    props: {
        value?: Value;
        defaultDenominator?: number;
    } = {},
) => {
    const onChange = vi.fn();
    const view = render(
        <FractionInput value={null} onChange={onChange} {...props} />,
    );
    return { ...view, onChange, user: userEvent.setup() };
};

const numerator = () => screen.getByLabelText("Numerator") as HTMLInputElement;
const denominator = () =>
    screen.getByLabelText("Denominator") as HTMLInputElement;
const percentField = () => screen.getByLabelText("Percent") as HTMLInputElement;
const modeButton = (name: "a/b" | "%") => screen.getByRole("button", { name });
// The mode pill is part of the field, so tabbing off an input lands on a
// button that is still inside it. Only a click right outside commits.
const leaveField = (user: ReturnType<typeof userEvent.setup>) =>
    user.click(document.body);

describe("FractionInput", () => {
    it("does not emit while the user is still typing", async () => {
        const { user, onChange } = setup();
        await user.type(numerator(), "3200");
        await user.type(denominator(), "10000");
        expect(onChange).not.toHaveBeenCalled();
    });

    it("emits the typed fraction exactly as typed on blur", async () => {
        const { user, onChange } = setup();
        await user.type(numerator(), "3200");
        await user.type(denominator(), "10000");
        await leaveField(user);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith({ num: 3200, den: 10000 });
        expect(numerator().value).toBe("3200");
        expect(denominator().value).toBe("10000");
    });

    it("emits on Enter without waiting for blur", async () => {
        const { user, onChange } = setup();
        await user.type(numerator(), "1");
        await user.type(denominator(), "2{Enter}");
        expect(onChange).toHaveBeenCalledWith({ num: 1, den: 2 });
    });

    it("keeps invalid text visible, emits null and marks the field invalid", async () => {
        const { user, onChange } = setup();
        await user.type(numerator(), "abc");
        await leaveField(user);
        expect(onChange).toHaveBeenCalledWith(null);
        expect(numerator().value).toBe("abc");
        expect(numerator().getAttribute("aria-invalid")).toBe("true");
    });

    it("treats a cleared field as empty, not invalid", async () => {
        const { user, onChange } = setup({ value: { num: 1, den: 2 } });
        expect(numerator().value).toBe("1");
        expect(denominator().value).toBe("2");
        await user.clear(numerator());
        await user.clear(denominator());
        await leaveField(user);
        expect(onChange).toHaveBeenCalledWith(null);
        expect(numerator().getAttribute("aria-invalid")).not.toBe("true");
    });

    it("shows a value set from outside, such as a preset chip", () => {
        const { rerender } = setup({ value: null });
        rerender(
            <FractionInput value={{ num: 3, den: 4 }} onChange={vi.fn()} />,
        );
        expect(numerator().value).toBe("3");
        expect(denominator().value).toBe("4");
    });

    it("moves to the denominator on '/' instead of typing it", async () => {
        const { user, onChange } = setup();
        await user.type(numerator(), "114/");
        expect(numerator().value).toBe("114");
        expect(document.activeElement).toBe(denominator());
        expect(onChange).not.toHaveBeenCalled();
    });

    describe("with a house denominator", () => {
        it("stands in for an empty denominator without filling the field", async () => {
            const { user, onChange } = setup({ defaultDenominator: 1332 });
            expect(denominator().placeholder).toBe("1332");
            await user.type(numerator(), "114");
            await leaveField(user);
            expect(onChange).toHaveBeenCalledWith({ num: 114, den: 1332 });
            // The echo of our own value must not overwrite the blank the user
            // deliberately left; the placeholder keeps carrying the meaning.
            expect(denominator().value).toBe("");
        });

        it("snaps a typed percent to the house denominator", async () => {
            const { user, onChange } = setup({ defaultDenominator: 1332 });
            await user.click(modeButton("%"));
            await user.type(percentField(), "8.6");
            await leaveField(user);
            expect(onChange).toHaveBeenCalledWith({ num: 115, den: 1332 });
        });

        it("shows the snapped share when switching percent to a/b", async () => {
            const { user } = setup({ defaultDenominator: 1332 });
            await user.click(modeButton("%"));
            await user.type(percentField(), "8.56");
            await user.click(modeButton("a/b"));
            expect(numerator().value).toBe("114");
            expect(denominator().value).toBe("1332");
        });
    });

    describe("without a house denominator", () => {
        it("requires the denominator", async () => {
            const { user, onChange } = setup();
            await user.type(numerator(), "114");
            await leaveField(user);
            expect(onChange).toHaveBeenCalledWith(null);
            expect(numerator().getAttribute("aria-invalid")).toBe("true");
        });

        it("emits the exact reduced fraction for a typed percent", async () => {
            const { user, onChange } = setup();
            await user.click(modeButton("%"));
            await user.type(percentField(), "8.56");
            await leaveField(user);
            expect(onChange).toHaveBeenCalledWith({ num: 107, den: 1250 });
        });
    });

    describe("switching modes", () => {
        it("shows the value as a percent", async () => {
            const { user } = setup({ value: { num: 114, den: 1332 } });
            await user.click(modeButton("%"));
            expect(percentField().value).toBe("8.56");
        });

        it("leaves a committed value untouched on a round trip", async () => {
            // 107/1250 is 8.56 %, which over 1332 would snap to 114/1332.
            // Merely looking at it as a percent must not rewrite it.
            const { user, onChange } = setup({
                value: { num: 107, den: 1250 },
                defaultDenominator: 1332,
            });
            await user.click(modeButton("%"));
            expect(percentField().value).toBe("8.56");
            await leaveField(user);
            expect(onChange).toHaveBeenLastCalledWith({ num: 107, den: 1250 });
        });

        it("does not commit on the way to the pill", async () => {
            const { user, onChange } = setup({ defaultDenominator: 1332 });
            await user.type(numerator(), "114");
            await user.click(modeButton("%"));
            expect(onChange).not.toHaveBeenCalled();
            expect(percentField().value).toBe("8.56");
        });

        it("treats a retyped percent as fresh input, not as the value it came from", async () => {
            // 1/3 renders as "33.33" but is not 3333/10000. Once the user has
            // typed, the text is all that counts — the same digits must not
            // mean two different things depending on invisible history.
            const { user, onChange } = setup({ value: { num: 1, den: 3 } });
            await user.click(modeButton("%"));
            expect(percentField().value).toBe("33.33");
            await user.clear(percentField());
            await user.type(percentField(), "33.33");
            await leaveField(user);
            expect(onChange).toHaveBeenLastCalledWith({
                num: 3333,
                den: 10000,
            });
        });

        it("clears the other mode when there is nothing to convert", async () => {
            const { user } = setup({ defaultDenominator: 1332 });
            await user.click(modeButton("%"));
            expect(percentField().value).toBe("");
            await user.click(modeButton("a/b"));
            expect(numerator().value).toBe("");
            expect(denominator().value).toBe("");
        });
    });

    it("survives being unmounted while focused, as a closing dialog does", async () => {
        const { user, unmount } = setup({ defaultDenominator: 1332 });
        await user.type(numerator(), "114");
        expect(() => unmount()).not.toThrow();
    });

    describe("in Czech", () => {
        beforeEach(() => {
            language = "cs";
        });

        it("writes the percent with a comma", async () => {
            const { user } = setup({ value: { num: 114, den: 1332 } });
            await user.click(modeButton("%"));
            expect(percentField().value).toBe("8,56");
        });

        it("reads a typed comma back", async () => {
            const { user, onChange } = setup({ defaultDenominator: 1332 });
            await user.click(modeButton("%"));
            await user.type(percentField(), "8,6");
            await leaveField(user);
            expect(onChange).toHaveBeenCalledWith({ num: 115, den: 1332 });
        });
    });
});
