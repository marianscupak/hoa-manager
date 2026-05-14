import { useTranslation } from "react-i18next";

import { Card, CardContent } from "@hoa-mngr/ui";

interface OwnersCardProps {
    active: number;
}

export function OwnersCard({ active }: OwnersCardProps) {
    const { t } = useTranslation("dashboard");
    return (
        <Card>
            <CardContent className="flex h-full flex-col gap-2 p-4">
                <p className="text-3xl font-semibold">{active}</p>
                <p className="text-sm">{t("buildingOverview.owners.active")}</p>
            </CardContent>
        </Card>
    );
}
