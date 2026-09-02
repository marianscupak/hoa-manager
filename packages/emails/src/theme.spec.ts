import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { colors } from "./theme";

/** Email colour key → `--color-<token>` in @hoa-mngr/ui/globals.css. */
const UI_TOKEN: Record<keyof typeof colors, string> = {
    background: "background",
    card: "card",
    foreground: "foreground",
    secondaryForeground: "secondary-foreground",
    mutedForeground: "muted-foreground",
    border: "border",
    primary: "primary",
};

function readUiColorTokens(): Map<string, string> {
    // Resolved through the UI package's declared "./globals.css" export.
    const cssPath = require.resolve("@hoa-mngr/ui/globals.css");
    const css = readFileSync(cssPath, "utf8");
    const tokens = new Map<string, string>();
    for (const [, name, hex] of css.matchAll(
        /--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g,
    )) {
        tokens.set(name, hex.toLowerCase());
    }
    return tokens;
}

describe("email theme colours", () => {
    const uiTokens = readUiColorTokens();

    it.each(Object.entries(UI_TOKEN))(
        "%s mirrors --color-%s from @hoa-mngr/ui",
        (key, token) => {
            const uiValue = uiTokens.get(token);
            expect(
                uiValue,
                `--color-${token} not found in @hoa-mngr/ui/globals.css`,
            ).toBeDefined();
            expect(colors[key as keyof typeof colors]).toBe(uiValue);
        },
    );
});
