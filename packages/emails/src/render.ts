import { render } from "@react-email/components";
import { createElement, type JSX } from "react";

import type { RenderedEmail } from "./types";

export interface EmailTemplate<P extends object> {
    subject: (props: P) => string;
    Component: (props: P) => JSX.Element;
}

/**
 * Renders one React tree twice — HTML and plain text — so both bodies
 * share a single source of truth. `<Preview>` is skipped in plain text.
 */
export async function renderTemplate<P extends object>(
    template: EmailTemplate<P>,
    props: P,
): Promise<RenderedEmail> {
    const element = createElement(template.Component, props);
    const [html, text] = await Promise.all([
        render(element),
        render(element, {
            plainText: true,
            htmlToTextOptions: {
                selectors: [{ selector: "h1", options: { uppercase: false } }],
            },
        }),
    ]);
    return { subject: template.subject(props), html, text };
}
