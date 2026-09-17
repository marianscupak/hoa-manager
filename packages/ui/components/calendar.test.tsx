// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Calendar } from "./calendar";

// The shared package carries no i18next instance; the calendar asks one only
// for the current language, which decides the date-fns locale.
let language: string | undefined = "cs";

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: {
            get language() {
                return language;
            },
        },
    }),
}));

afterEach(cleanup);

const september2026 = new Date(2026, 8, 17);

describe("Calendar", () => {
    it("names the month and weekdays in Czech and starts the week on Monday", () => {
        language = "cs";
        render(<Calendar mode="single" defaultMonth={september2026} />);

        expect(screen.getByText(/z[áa][řr][íi] 2026/i)).toBeTruthy();

        const weekdays = screen
            .getAllByRole("columnheader")
            .map((cell) => cell.textContent?.trim());
        expect(weekdays[0]).toBe("po");
        expect(weekdays).toHaveLength(7);
    });

    it("falls back to English when the language is not Czech", () => {
        language = "en";
        render(<Calendar mode="single" defaultMonth={september2026} />);

        expect(screen.getByText(/September 2026/)).toBeTruthy();
        expect(
            screen.getAllByRole("columnheader")[0]?.textContent?.trim(),
        ).toBe("Su");
    });

    it("survives an i18n instance that has no language yet", () => {
        language = undefined;
        expect(() =>
            render(<Calendar mode="single" defaultMonth={september2026} />),
        ).not.toThrow();
    });

    it("lets an explicit locale win over the app language", async () => {
        language = "cs";
        const { enUS } = await import("date-fns/locale");
        render(
            <Calendar
                mode="single"
                defaultMonth={september2026}
                locale={enUS}
            />,
        );

        expect(screen.getByText(/September 2026/)).toBeTruthy();
    });
});
