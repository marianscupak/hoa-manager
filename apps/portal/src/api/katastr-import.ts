import type {
    KatastrImportPreviewResponseDto,
    KatastrImportResultResponseDto,
} from "@/api/generated/model";

import { customInstance } from "./axios";

export function previewKatastrImport(
    file: File,
    effectiveAt: string | null,
): Promise<KatastrImportPreviewResponseDto> {
    const body = new FormData();
    body.append("file", file);
    if (effectiveAt !== null) body.append("effectiveAt", effectiveAt);
    return customInstance<KatastrImportPreviewResponseDto>({
        url: "/api/katastr-import/preview",
        method: "POST",
        data: body,
    });
}

export function applyKatastrImport(
    file: File,
    effectiveAt: string,
    planHash: string,
): Promise<KatastrImportResultResponseDto> {
    const body = new FormData();
    body.append("file", file);
    body.append("effectiveAt", effectiveAt);
    body.append("planHash", planHash);
    return customInstance<KatastrImportResultResponseDto>({
        url: "/api/katastr-import/apply",
        method: "POST",
        data: body,
    });
}
