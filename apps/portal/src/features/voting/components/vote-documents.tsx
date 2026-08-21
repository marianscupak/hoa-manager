import { Download, File } from "lucide-react";

export function VoteDocuments() {
    // Mocked documents for visual representation until backend supports it
    const mockDocuments = [
        {
            id: "1",
            name: "2026_Budget_Proposal.pdf",
            size: "2.6 MB",
            uploaded: "1. 2. 2026 15:30",
        },
        {
            id: "2",
            name: "2025_Budget_Audit.pdf",
            size: "2.1 MB",
            uploaded: "1. 2. 2026 15:35",
        },
    ];

    return (
        <div className="flex flex-col gap-2">
            {mockDocuments.map((doc) => (
                <div
                    key={doc.id}
                    className="rounded-panel border-hairline hover:bg-muted flex items-center justify-between gap-3 border p-3 transition-colors"
                >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="bg-destructive-muted text-destructive-muted-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                            <File className="h-[17px] w-[17px]" />
                        </div>
                        <span className="truncate text-sm font-medium">
                            {doc.name}
                        </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                        <span className="text-muted-foreground text-xs">
                            {doc.size}
                        </span>
                        <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground shrink-0 rounded-md p-1 transition-colors"
                        >
                            <Download className="h-[15px] w-[15px]" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
