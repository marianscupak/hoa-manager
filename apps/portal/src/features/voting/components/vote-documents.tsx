import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";

export function VoteDocuments() {
    const { t } = useTranslation(["voting"]);

    // Mocked documents for visual representation until backend supports it
    const mockDocuments = [
        { id: "1", name: "2026_Budget_Proposal.pdf", size: "2.6 MB", uploaded: "1. 2. 2026 15:30" },
        { id: "2", name: "2025_Budget_Audit.pdf", size: "2.1 MB", uploaded: "1. 2. 2026 15:35" },
    ];

    return (
        <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">{t("voting:detail.documents.title")}</h2>
            <div className="flex flex-col gap-3">
                {mockDocuments.map((doc) => (
                    <div 
                        key={doc.id} 
                        className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm hover:border-slate-300 transition-colors cursor-pointer group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded bg-red-50 text-red-500 font-bold text-xs select-none">
                                PDF
                            </div>
                            <div>
                                <p className="font-semibold text-sm">{doc.name}</p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {doc.size}, {t("voting:detail.documents.uploaded")} {doc.uploaded}
                                </p>
                            </div>
                        </div>
                        <button className="text-slate-400 group-hover:text-slate-600 transition-colors p-2">
                            <Download className="h-5 w-5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
