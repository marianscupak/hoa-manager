// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Dialog, DialogContent, DialogTitle } from "./dialog";

afterEach(cleanup);

const open = () =>
    render(
        <Dialog open>
            <DialogContent>
                <DialogTitle>Upravit vlastnictví</DialogTitle>
                <p>body</p>
            </DialogContent>
        </Dialog>,
    );

describe("DialogContent", () => {
    it("caps its height so a tall dialog cannot run off the viewport", () => {
        open();
        // Centred with a translate, an uncapped dialog overflows both ends of
        // the screen and neither the page nor the dialog can scroll to it.
        const frame = screen.getByRole("dialog");
        expect(frame.className).toContain("max-h-[calc(100dvh-2rem)]");
    });

    it("scrolls the body rather than the frame, so the close button stays put", () => {
        open();
        const frame = screen.getByRole("dialog");
        const body = screen.getByText("body").parentElement!;

        expect(body.className).toContain("overflow-y-auto");
        // min-h-0 or the flex child refuses to shrink below its content and
        // the overflow never kicks in.
        expect(body.className).toContain("min-h-0");
        expect(frame.contains(body)).toBe(true);

        const close = screen.getByRole("button", { name: /close/i });
        expect(body.contains(close)).toBe(false);
    });

    it("leaves room inside the scroll area for a button's clay shadow", () => {
        // `--shadow-clay-btn` paints a solid 4px offset below the button and a
        // 26px glow around it. With the scroll area ending flush against the
        // content, the overflow sliced that off and a footer button looked
        // cut in half.
        open();
        const body = screen.getByText("body").parentElement!;

        expect(body.className).toContain("pb-6");
        expect(body.className).toContain("px-6");
        // Pulled out to the frame's edges so the padding above is inside the
        // scroll area rather than added on top of the frame's own.
        expect(body.className).toContain("-mx-6");
        expect(body.className).toContain("-mb-6");
    });
});
