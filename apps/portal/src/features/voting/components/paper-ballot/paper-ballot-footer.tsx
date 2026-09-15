import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@hoa-mngr/ui";

export interface PaperBallotFooterProps {
    onBack: () => void;
    onNext: () => void;
    backLabel: string;
    nextLabel: string;
    nextDisabled?: boolean;
    isPending?: boolean;
}

export function PaperBallotFooter({
    onBack,
    onNext,
    backLabel,
    nextLabel,
    nextDisabled,
    isPending,
}: PaperBallotFooterProps) {
    return (
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4 py-3">
            <Button variant="outline" onClick={onBack} disabled={isPending}>
                <ArrowLeft />
                {backLabel}
            </Button>
            <Button onClick={onNext} disabled={nextDisabled || isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : null}
                {nextLabel}
                {!isPending && <ArrowRight />}
            </Button>
        </div>
    );
}
