// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FileDropzone, type FileDropzoneProps } from "./file-dropzone";

afterEach(cleanup);

/** Small limits keep the fixtures cheap — 101 bytes already exceeds the cap. */
const MAX_BYTES = 100;
const ACCEPT = ["application/pdf", "image/png"] as const;

const file = (name: string, type: string, bytes = 10) =>
    new File([new Uint8Array(bytes)], name, { type });

const setup = (props: Partial<FileDropzoneProps> = {}) => {
    const onFiles = vi.fn();
    const onReject = vi.fn();
    const { container } = render(
        <FileDropzone
            accept={ACCEPT}
            maxSizeBytes={MAX_BYTES}
            onFiles={onFiles}
            onReject={onReject}
            label="Drop the file here or browse"
            hint="PDF or PNG · max 100 B"
            {...props}
        />,
    );
    const input = container.querySelector(
        'input[type="file"]',
    ) as HTMLInputElement;
    // The component renders exactly one root element — the drop target.
    const dropzone = container.firstChild as HTMLElement;
    return { onFiles, onReject, input, dropzone };
};

/**
 * The browse path is driven with `fireEvent.change` rather than
 * `userEvent.upload`: user-event filters the selection against the input's
 * `accept` attribute before dispatching, so a type-rejection test would pass
 * without the component validating anything. Handing the files straight to the
 * change handler exercises our own checks, which are what actually gate the
 * upload.
 */
const pick = (input: HTMLInputElement, files: File[]) =>
    fireEvent.change(input, { target: { files } });

const drop = (dropzone: HTMLElement, files: File[]) =>
    fireEvent.drop(dropzone, { dataTransfer: { files } });

describe("FileDropzone", () => {
    it("passes a file that satisfies both the type and the size limit", () => {
        const { onFiles, onReject, input } = setup();
        const pdf = file("scan.pdf", "application/pdf");

        pick(input, [pdf]);

        expect(onFiles).toHaveBeenCalledWith([pdf]);
        expect(onReject).not.toHaveBeenCalled();
    });

    it("rejects a file whose content type is not accepted", () => {
        const { onFiles, onReject, input } = setup();
        const doc = file("notes.docx", "application/msword");

        pick(input, [doc]);

        expect(onReject).toHaveBeenCalledWith({ file: doc, reason: "type" });
        expect(onFiles).not.toHaveBeenCalled();
    });

    it("rejects a file larger than maxSizeBytes", () => {
        const { onFiles, onReject, input } = setup();
        const big = file("huge.pdf", "application/pdf", MAX_BYTES + 1);

        pick(input, [big]);

        expect(onReject).toHaveBeenCalledWith({ file: big, reason: "size" });
        expect(onFiles).not.toHaveBeenCalled();
    });

    it("reports each rejection in a multi-file selection and still passes the survivors", () => {
        const { onFiles, onReject, input } = setup({ multiple: true });
        const ok = file("ok.pdf", "application/pdf");
        const wrongType = file("notes.docx", "application/msword");
        const tooBig = file("huge.png", "image/png", MAX_BYTES + 1);

        pick(input, [ok, wrongType, tooBig]);

        expect(onFiles).toHaveBeenCalledTimes(1);
        expect(onFiles).toHaveBeenCalledWith([ok]);
        expect(onReject).toHaveBeenCalledTimes(2);
        expect(onReject).toHaveBeenCalledWith({
            file: wrongType,
            reason: "type",
        });
        expect(onReject).toHaveBeenCalledWith({ file: tooBig, reason: "size" });
    });

    it("takes only the first file when multiple is not set", () => {
        const { onFiles, onReject, input } = setup();
        const first = file("first.pdf", "application/pdf");
        const second = file("second.docx", "application/msword");

        pick(input, [first, second]);

        expect(onFiles).toHaveBeenCalledWith([first]);
        // The second file was never a candidate, so it must not be reported as
        // a rejection either.
        expect(onReject).not.toHaveBeenCalled();
    });

    it("accepts files dropped onto the target", () => {
        const { onFiles, onReject, dropzone } = setup();
        const pdf = file("dropped.pdf", "application/pdf");

        drop(dropzone, [pdf]);

        expect(onFiles).toHaveBeenCalledWith([pdf]);
        expect(onReject).not.toHaveBeenCalled();
    });

    it("ignores a drop while disabled", () => {
        const { onFiles, onReject, dropzone } = setup({ disabled: true });

        drop(dropzone, [file("scan.pdf", "application/pdf")]);

        expect(onFiles).not.toHaveBeenCalled();
        expect(onReject).not.toHaveBeenCalled();
    });
});
