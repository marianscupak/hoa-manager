import { describe, expect, it } from "vitest";

import { formatFileSize } from "./file-size";

describe("formatFileSize", () => {
    it("keeps one decimal from a megabyte up", () => {
        expect(formatFileSize(1_468_006)).toBe("1.4 MB");
    });

    it("rounds to whole kilobytes below that", () => {
        expect(formatFileSize(5_600)).toBe("5 kB");
    });

    it("falls back to bytes for a tiny file", () => {
        expect(formatFileSize(512)).toBe("512 B");
    });
});
