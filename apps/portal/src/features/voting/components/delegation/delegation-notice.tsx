import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Card } from "@hoa-mngr/ui";

export const DelegationNotice = () => {
    const { t } = useTranslation("voting");

    return (
        <Card className="border-2 border-dashed border-orange-200 bg-orange-50 p-6 shadow-none">
            <div className="flex items-start gap-4">
                <div className="mt-0.5 rounded-lg bg-orange-100 p-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                    <h3 className="mb-1 font-bold text-orange-900">
                        {t("delegate.notice.title")}
                    </h3>
                    <p className="text-sm leading-relaxed text-orange-800">
                        {t("delegate.notice.description")}
                    </p>
                </div>
            </div>
        </Card>
    );
};
