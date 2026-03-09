import { useTranslation } from "react-i18next";

import { FormInput, FormDatetimePicker } from "@hoa-mngr/ui";

export function CreateVoteBasicInfoStep() {
    const { t } = useTranslation(["voting"]);

    return (
        <div className="space-y-4">
            <FormInput
                name="title"
                label={t("voting:create.fields.title.label", "Title")}
                placeholder={t("voting:create.fields.title.placeholder")}
            />

            <FormInput
                name="description"
                label={t("voting:create.fields.description.label")}
                placeholder={t("voting:create.fields.description.placeholder")}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormDatetimePicker
                    name="scheduledFrom"
                    label={t("voting:create.fields.scheduledFrom.label")}
                    description={t(
                        "voting:create.fields.scheduledFrom.description",
                    )}
                />

                <FormDatetimePicker
                    name="scheduledTo"
                    label={t("voting:create.fields.scheduledTo.label")}
                    description={t(
                        "voting:create.fields.scheduledTo.description",
                    )}
                />
            </div>
        </div>
    );
}
