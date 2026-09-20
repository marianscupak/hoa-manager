import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { PAGE_ACTION_BAR_SLOT_ID } from "./app-shell";

/**
 * A strip pinned to the bottom of the viewport for a page whose primary
 * action sits at the end of a long read.
 *
 * It renders into `<main>` rather than where it is written, because the
 * page's own content box is capped at `max-w-6xl` and a sticky element
 * cannot leave its containing block: inside it, the bar would be inset from
 * the window on both sides and would lift away from the bottom edge the
 * moment the page was scrolled to its end. As a flex child of `main` it
 * spans the column, and `mt-auto` holds it at the bottom on a page too
 * short to scroll.
 *
 * The inner row carries the content column's own width and gutters, so the
 * buttons line up with the cards above them.
 */
export function PageActionBar({ children }: { children: ReactNode }) {
    // `main` does not exist on the first render of a page inside it, so the
    // node is read once the shell is mounted rather than during render.
    const [slot, setSlot] = useState<HTMLElement | null>(null);
    useEffect(() => {
        setSlot(document.getElementById(PAGE_ACTION_BAR_SLOT_ID));
    }, []);

    if (slot === null) return null;

    return createPortal(
        <div className="border-border bg-card/92 sticky bottom-0 z-10 mt-auto border-t px-4 py-3.5 backdrop-blur-md md:px-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
        </div>,
        slot,
    );
}
