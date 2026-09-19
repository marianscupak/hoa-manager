import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { format, parse } from "date-fns";
import { useAtomValue } from "jotai";
import { ChevronLeftIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import {
    Button,
    Card,
    DatePicker,
    ErrorState,
    FileDropzone,
    type FileRejection,
} from "@hoa-mngr/ui";

import type {
    KatastrImportPreviewResponseDto,
    KatastrImportResultResponseDto,
} from "@/api/generated/model";
import { applyKatastrImport, previewKatastrImport } from "@/api/katastr-import";
import { tenantContextAtom } from "@/auth/atoms";
import { Role } from "@/auth/roles";

import { ActionBar } from "../components/katastr-import/action-bar";
import { Blockers } from "../components/katastr-import/blockers";
import {
    KATASTR_IMPORT_ACCEPTED_CONTENT_TYPES,
    KATASTR_IMPORT_MAX_SIZE_BYTES,
} from "../components/katastr-import/constants";
import { CountStrip } from "../components/katastr-import/count-strip";
import {
    DROPZONE_REJECTION_KEY,
    isDropzoneRejectionError,
    katastrErrorMessages,
    stalePreviewFrom,
    type KatastrErrorBody,
    type Translate,
} from "../components/katastr-import/errors";
import { FileCard } from "../components/katastr-import/file-card";
import { ImportUnitsTable } from "../components/katastr-import/import-units-table";
import { invalidateKatastrImportQueries } from "../components/katastr-import/invalidate-import-queries";
import { OwnerList } from "../components/katastr-import/owner-list";
import {
    StepPills,
    type KatastrImportStep,
} from "../components/katastr-import/step-pills";
import { Warnings } from "../components/katastr-import/warnings";

/** The trigger is a button, so the caption points at it by id rather than
 *  wrapping it. */
const EFFECTIVE_AT_LABEL_ID = "katastr-effective-at-label";

export function KatastrImportPage() {
    const { t } = useTranslation("katastr");
    const tenantCtx = useAtomValue(tenantContextAtom);
    const queryClient = useQueryClient();
    const [file, setFile] = useState<File | null>(null);
    const [effectiveAt, setEffectiveAt] = useState<string | null>(null);
    const [preview, setPreview] =
        useState<KatastrImportPreviewResponseDto | null>(null);
    const [previewError, setPreviewError] = useState<unknown>(null);
    const [result, setResult] = useState<KatastrImportResultResponseDto | null>(
        null,
    );
    const [applyError, setApplyError] = useState<unknown>(null);

    // Identifies the most recently dispatched preview request. Two dates
    // picked in quick succession can have their responses arrive out of
    // order on any real network — without this, the earlier one's response
    // landing last would silently overwrite `preview` and the date field
    // with data for a date the admin already moved past (Finding 1).
    // Comparing by reference to the exact object handed to `mutate` is
    // enough: every call to `runPreview` creates a fresh one.
    const latestRequestRef = useRef<{
        file: File;
        effectiveAt: string | null;
    } | null>(null);

    // Identifies which request produced the preview currently on screen.
    // This is the thing Confirm actually needs to know — not "is a preview
    // pending" (a naive check on `previewMutation.isPending` re-enables
    // Confirm the moment a *failed* re-preview stops being pending, even
    // though `preview`/`planHash` still describe the old inputs and
    // `effectiveAt` already reads the new ones) but "does the plan on
    // screen still describe the current inputs." Set only on a genuine,
    // still-latest preview success (never on error, never eagerly in
    // `runPreview`), so it naturally lags `latestRequestRef` — and stays
    // lagged, not just momentarily pending — for exactly as long as the
    // displayed plan is out of date with the current file/date.
    const previewRequestRef = useRef<{
        file: File;
        effectiveAt: string | null;
    } | null>(null);
    const previewIsCurrent =
        preview !== null &&
        previewRequestRef.current === latestRequestRef.current;

    const previewMutation = useMutation({
        mutationFn: (input: { file: File; effectiveAt: string | null }) =>
            previewKatastrImport(input.file, input.effectiveAt),
        onSuccess: (result, variables) => {
            if (variables !== latestRequestRef.current) return;
            setPreviewError(null);
            setPreview(result);
            // The API already hands back a YYYY-MM-DD calendar day (see
            // toPreviewResponse), which is exactly what the date input
            // wants — no reduction needed here.
            setEffectiveAt(result.effectiveAt);
            previewRequestRef.current = variables;
        },
        onError: (error, variables) => {
            if (variables !== latestRequestRef.current) return;
            setPreviewError(error);
        },
    });

    const runPreview = (nextEffectiveAt: string | null) => {
        if (file === null) return;
        const request = { file, effectiveAt: nextEffectiveAt };
        latestRequestRef.current = request;
        setPreviewError(null);
        // A fresh preview attempt makes any apply-time error (a stale
        // note, a re-surfaced blocker) moot — it referred to a plan the
        // admin is about to replace.
        setApplyError(null);
        previewMutation.mutate(request);
    };

    // Confirming writes real data, so its own error handling gets a
    // careful look. Its 409 (KATASTR_IMPORT_PLAN_STALE) path calls
    // `setPreview` with a fresh plan from the server — and now that
    // Confirm can only be clicked while `previewIsCurrent` is true (see
    // below), and the file/date inputs are locked for the whole time an
    // apply is in flight (so nothing can advance `latestRequestRef` behind
    // its back), that fresh plan necessarily describes exactly what the
    // admin was looking at when they clicked Confirm. There is no longer a
    // narrower, still-in-flight preview request that could supersede it,
    // so the fresh plan is applied unconditionally rather than guarded
    // against one.
    const applyMutation = useMutation({
        mutationFn: (input: {
            file: File;
            effectiveAt: string;
            planHash: string;
        }) => applyKatastrImport(input.file, input.effectiveAt, input.planHash),
        onSuccess: (r) => {
            setApplyError(null);
            setResult(r);
            setPreview(null);
            // The import can create/update any number of units and owners,
            // change the property's building-share total, and always writes
            // an audit event — exactly the data the admin lands on next
            // (the units/owners list, or the timeline that showed them
            // nothing had happened).
            invalidateKatastrImportQueries(queryClient);
        },
        onError: (error: unknown) => {
            const body =
                error instanceof AxiosError
                    ? (error.response?.data as KatastrErrorBody | undefined)
                    : undefined;
            const fresh = stalePreviewFrom(body);
            if (fresh !== null) {
                setPreview(fresh);
                setEffectiveAt(fresh.effectiveAt);
                // Re-affirms `previewIsCurrent`. Under the input lock above
                // this is provably already true, but it costs nothing to
                // keep the invariant self-consistent rather than relying
                // on that lock never being loosened later.
                previewRequestRef.current = latestRequestRef.current;
            }
            setApplyError(error);
        },
    });

    // This bulk write is hard to unwind, so it follows the ADMIN-only
    // precedent the endpoint itself enforces (@Roles(ADMIN), stricter than
    // the admin-or-board shell every other /admin route uses). The shared
    // route guard lets a board member reach this URL, so the page must
    // refuse on its own rather than showing a form the API will 403.
    const isAdmin = !!tenantCtx?.roles.includes(Role.ADMIN);
    if (!isAdmin) {
        return <ErrorState message={t("adminOnly")} />;
    }

    if (result !== null) {
        return <ImportDone result={result} />;
    }

    // Any request in flight freezes every input on the page. For the file
    // and the date that keeps `latestRequestRef` from moving behind an
    // in-flight apply's back — which is what lets its 409 path apply a
    // fresh plan unconditionally (see `applyMutation` above).
    const isLocked = previewMutation.isPending || applyMutation.isPending;

    const returnToDropzone = () => {
        setPreview(null);
        setFile(null);
        setApplyError(null);
    };

    return (
        <div className="flex flex-col gap-4">
            <ImportHeader
                step={preview === null ? "file" : "preview"}
                intro={preview === null ? t("intro") : t("previewIntro")}
            />

            {previewError !== null && <ImportErrors error={previewError} />}

            {preview === null ? (
                <div className="flex flex-col gap-3">
                    <FileDropzone
                        accept={KATASTR_IMPORT_ACCEPTED_CONTENT_TYPES}
                        maxSizeBytes={KATASTR_IMPORT_MAX_SIZE_BYTES}
                        disabled={isLocked}
                        onFiles={([selected]) => {
                            setPreview(null);
                            setPreviewError(null);
                            setApplyError(null);
                            setFile(selected);
                        }}
                        onReject={({ reason }: FileRejection) =>
                            setPreviewError({ dropzoneRejection: reason })
                        }
                        label={t("dropzone.label")}
                        hint={t("dropzone.hint")}
                    />
                    {file !== null && (
                        <p className="text-muted-foreground text-sm">
                            {file.name}
                        </p>
                    )}
                    <Button
                        className="w-fit"
                        disabled={file === null || isLocked}
                        onClick={() => runPreview(null)}
                    >
                        {t("analyze")}
                    </Button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(290px,1fr))] items-start gap-4">
                        {file !== null && (
                            <FileCard
                                file={file}
                                document={preview.document}
                                onReplace={returnToDropzone}
                                replaceDisabled={isLocked}
                            />
                        )}
                        <Card className="px-[18px] py-4">
                            <h2
                                id={EFFECTIVE_AT_LABEL_ID}
                                className="text-md font-bold tracking-[-0.1px]"
                            >
                                {t("effectiveAt.label")}
                            </h2>
                            <DatePicker
                                className="mt-3"
                                aria-labelledby={EFFECTIVE_AT_LABEL_ID}
                                // The state is the API's `YYYY-MM-DD`
                                // calendar day; `parse` reads it in local
                                // time, where `new Date(string)` would read
                                // it as UTC midnight and can land on the
                                // day before.
                                value={
                                    effectiveAt
                                        ? parse(
                                              effectiveAt,
                                              "yyyy-MM-dd",
                                              new Date(),
                                          )
                                        : null
                                }
                                disabled={isLocked}
                                onChange={(day) => {
                                    const value = day
                                        ? format(day, "yyyy-MM-dd")
                                        : null;
                                    setEffectiveAt(value);
                                    // Clearing the day leaves nothing to
                                    // preview for. Re-preview with none
                                    // rather than leaving the old preview
                                    // on screen for a date that is no
                                    // longer selected — the API falls back
                                    // to its own default (ct:platnost),
                                    // which then repopulates this field
                                    // once the response lands (Finding 4).
                                    runPreview(value);
                                }}
                            />
                            <p className="text-muted-foreground mt-2.5 text-[12.5px] leading-[18px]">
                                {t("effectiveAt.hint")}
                            </p>
                        </Card>
                    </div>

                    <CountStrip counts={preview.counts} />
                    <Blockers blockers={preview.blockers} />
                    <Warnings warnings={preview.warnings} />
                    <ImportUnitsTable preview={preview} />
                    <OwnerList owners={preview.owners} />

                    <ActionBar
                        counts={preview.counts}
                        blockerCount={preview.blockers.length}
                        notice={
                            applyError !== null ? (
                                <ApplyErrorNotice error={applyError} />
                            ) : undefined
                        }
                        cancelDisabled={isLocked}
                        confirmDisabled={
                            preview.blockers.length > 0 ||
                            file === null ||
                            effectiveAt === null ||
                            // The plan on screen must still describe the
                            // current file/date. A pending re-preview fails
                            // this (as before), but so does one that just
                            // *failed* — its error never updates
                            // `previewRequestRef`, so a naive "not pending"
                            // check would have re-enabled Confirm for a
                            // plan that no longer matches the visible
                            // `effectiveAt`.
                            !previewIsCurrent ||
                            applyMutation.isPending
                        }
                        onCancel={returnToDropzone}
                        onConfirm={() => {
                            if (file === null || effectiveAt === null) return;
                            applyMutation.mutate({
                                file,
                                effectiveAt,
                                planHash: preview.planHash,
                            });
                        }}
                    />
                </>
            )}
        </div>
    );
}

/** Title, one line of orientation, and where the admin is in the flow. */
function ImportHeader({
    step,
    intro,
}: {
    step: KatastrImportStep;
    intro: string;
}) {
    const { t } = useTranslation("katastr");

    return (
        <div className="flex flex-col gap-3">
            <Link
                to="/units"
                className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold transition-colors"
            >
                <ChevronLeftIcon aria-hidden className="h-[13px] w-[13px]" />
                {t("backLink")}
            </Link>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {t("title")}
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-[560px] text-sm">
                        {intro}
                    </p>
                </div>
                <StepPills current={step} />
            </div>
        </div>
    );
}

function ImportDone({ result }: { result: KatastrImportResultResponseDto }) {
    const { t } = useTranslation("katastr");

    return (
        <div className="flex flex-col gap-4">
            <ImportHeader step="done" intro={t("previewIntro")} />
            <Card className="flex flex-col items-start gap-4 px-[18px] py-5">
                <div>
                    <h2 className="font-display text-title font-extrabold tracking-tight">
                        {t("done.heading")}
                    </h2>
                    <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                        {t("done.summary", {
                            created: result.counts.unitsCreated,
                            updated: result.counts.unitsUpdated,
                        })}
                    </p>
                </div>
                <Button asChild>
                    <Link to="/units">{t("done.backToUnits")}</Link>
                </Button>
            </Card>
        </div>
    );
}

/**
 * Apply-time failures need a different treatment per shape: the 409 has
 * already swapped in a fresh plan, so it gets its own explanatory note
 * rather than an error list; a 422's `blockers` are `blockers.*` catalogue
 * keys, so they render through `Blockers`, not `ImportErrors` (whose
 * `errors.*` lookup would miss and fall back to a generic message); anything
 * else falls through to the same rendering the preview call uses.
 */
function ApplyErrorNotice({ error }: { error: unknown }) {
    const { t } = useTranslation("katastr");
    if (error === null) return null;

    const body =
        error instanceof AxiosError
            ? (error.response?.data as KatastrErrorBody | undefined)
            : undefined;

    if (stalePreviewFrom(body) !== null) {
        return <p className="text-warning-deep text-sm">{t("errors.STALE")}</p>;
    }
    if (body?.blockers) {
        return <Blockers blockers={body.blockers} />;
    }
    return <ImportErrors error={error} />;
}

/**
 * A `FileDropzone` rejection never reaches the server — there is no
 * `AxiosError` and no catalogue-checked body to extract, just a reason the
 * dropzone already classified. It renders through the same box as an API
 * error (`ErrorBox` below), on its own translation key, instead of being
 * threaded through `katastrErrorMessages`, which exists to decode bodies
 * the API actually sends.
 */
function ImportErrors({ error }: { error: unknown }) {
    const { t } = useTranslation("katastr");

    if (isDropzoneRejectionError(error)) {
        return (
            <ErrorBox
                messages={[t(DROPZONE_REJECTION_KEY[error.dropzoneRejection])]}
            />
        );
    }

    const body =
        error instanceof AxiosError
            ? (error.response?.data as KatastrErrorBody | undefined)
            : undefined;

    // The extraction, the fallback for a code with no catalogue entry, and
    // the fallback for no parseable body at all now live in
    // `errors.ts` — this is the "code with no copy" risk surface the whole
    // task is about, so it has its own test rather than living only here.
    // `t`'s type only allows its own namespace's literal keys; `Translate`
    // is deliberately looser so `errors.ts` stays plain and testable
    // without i18next, hence the cast at this one boundary.
    const messages = katastrErrorMessages(t as unknown as Translate, body);

    return <ErrorBox messages={messages} />;
}

function ErrorBox({ messages }: { messages: string[] }) {
    const { t } = useTranslation("katastr");

    return (
        <section className="border-destructive/30 bg-destructive-faint rounded-card shadow-clay-card-destructive border px-[18px] py-4">
            <h2 className="text-destructive-muted-foreground text-[14.5px] font-bold">
                {t("errors.heading")}
            </h2>
            <ul className="mt-2.5 flex flex-col gap-2">
                {messages.map((message, index) => (
                    <li
                        key={index}
                        className="text-destructive-deep text-detail flex gap-2.5 leading-[19px]"
                    >
                        <span
                            aria-hidden
                            className="bg-destructive mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full"
                        />
                        <span>{message}</span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
