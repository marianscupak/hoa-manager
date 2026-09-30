import { useTranslation } from "react-i18next";

import { StatusChip } from "@hoa-mngr/ui";

import type { PersonResponseDto } from "@/api/generated/model";

import { PERSON_STATUS_CHIP, personStatus } from "../utils/person-status";

/** One status for a person, the same in the table and on their page. */
export function PersonStatusChip({
    person,
}: {
    person: Pick<PersonResponseDto, "membershipId" | "status" | "inviteStatus">;
}) {
    const { t } = useTranslation(["admin"]);
    const status = personStatus(person);

    if (status === "noAccount") {
        return (
            <span className="text-faint text-sm">
                {t("people.access.noAccount")}
            </span>
        );
    }

    const chip = PERSON_STATUS_CHIP[status];
    return (
        <StatusChip variant={chip.variant}>
            {t(chip.labelKey as "people.access.invited")}
        </StatusChip>
    );
}
