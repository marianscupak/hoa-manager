// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { DataTable, type ColumnDef } from "./data-table";

afterEach(cleanup);

interface Row {
    id: string;
    name: string;
    voted: boolean;
}

const DATA: Row[] = [
    { id: "1", name: "A1", voted: true },
    { id: "2", name: "A2", voted: false },
];

const COLUMNS: ColumnDef<Row>[] = [
    { id: "name", accessorKey: "name", header: "Unit" },
];

const setup = (
    props: Partial<React.ComponentProps<typeof DataTable<Row>>> = {},
) => {
    render(
        <DataTable
            columns={COLUMNS}
            data={DATA}
            gridTemplate="1fr"
            emptyMessage="No units"
            countLabel={(info) => `${info.total} units`}
            {...props}
        />,
    );
    return userEvent.setup();
};

// The brief leaves label builders as caller-supplied (no hardcoded English in
// the component), so the tests exercising expansion supply them explicitly.
const EXPANDABLE = {
    getRowCanExpand: (row: Row) => row.voted,
    renderSubRow: (row: Row) => <span>Answers for {row.name}</span>,
    expandRowLabel: (row: Row) => `Expand row ${row.name}`,
    collapseRowLabel: (row: Row) => `Collapse row ${row.name}`,
};

describe("DataTable row expansion", () => {
    it("renders no expander when the props are absent", () => {
        setup();
        expect(
            screen.queryAllByRole("button", { name: /expand/i }),
        ).toHaveLength(0);
    });

    it("shows a sub-row only after the expander is pressed", async () => {
        const user = setup(EXPANDABLE);

        expect(screen.queryByText("Answers for A1")).toBeNull();

        await user.click(screen.getByRole("button", { name: "Expand row A1" }));

        expect(screen.getByText("Answers for A1")).toBeTruthy();
    });

    it("marks the expander's state for assistive technology", async () => {
        const user = setup(EXPANDABLE);

        const toggle = screen.getByRole("button", { name: "Expand row A1" });
        expect(toggle.getAttribute("aria-expanded")).toBe("false");

        await user.click(toggle);

        expect(
            screen
                .getByRole("button", { name: "Collapse row A1" })
                .getAttribute("aria-expanded"),
        ).toBe("true");
    });

    it("gives no expander to a row that cannot expand", () => {
        setup(EXPANDABLE);

        expect(screen.queryByRole("button", { name: /row A2/ })).toBeNull();
    });
});
