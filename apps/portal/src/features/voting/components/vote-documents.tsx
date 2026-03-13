import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";

export function VoteDocuments() {
    const { t } = useTranslation(["voting"]);

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
        <div className="mb-8">
            <h2 className="mb-4 text-xl font-bold">
                {t("voting:detail.documents.title")}
            </h2>
            <div className="flex flex-col gap-3">
                {mockDocuments.map((doc) => (
                    <div
                        key={doc.id}
                        className="group flex cursor-pointer items-center justify-between rounded-lg border bg-white p-4 shadow-sm transition-colors hover:border-slate-300"
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded bg-red-50 text-xs font-bold text-red-500 select-none">
                                PDF
                            </div>
                            <div>
                                <p className="text-sm font-semibold">
                                    {doc.name}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {doc.size},{" "}
                                    {t("voting:detail.documents.uploaded")}{" "}
                                    {doc.uploaded}
                                </p>
                            </div>
                        </div>
                        <button className="p-2 text-slate-400 transition-colors group-hover:text-slate-600">
                            <Download className="h-5 w-5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
