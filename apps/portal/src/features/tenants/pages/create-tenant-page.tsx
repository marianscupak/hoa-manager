import { useTranslation } from "react-i18next";

import { Form, FormInput, Button } from "@hoa-mngr/ui";

import { useCreateTenant } from "../hooks/use-create-tenant";

export function CreateTenantPage() {
    const { t } = useTranslation("auth");
    const { form, handleCreateTenant, isPending, isError } = useCreateTenant();

    return (
        <div className="bg-card w-full rounded-xl border p-8 shadow-sm">
            <h1 className="text-foreground mb-2 text-center text-2xl font-bold tracking-tight">
                {t("createTenant.title")}
            </h1>
            <p className="text-muted-foreground mb-6 text-center text-sm">
                {t("createTenant.description")}
            </p>

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(handleCreateTenant)}
                    className="space-y-4"
                >
                    <FormInput
                        name="name"
                        label={t("createTenant.nameLabel")}
                        placeholder={t("createTenant.namePlaceholder")}
                        disabled={isPending}
                    />

                    <div className="pt-4">
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="w-full"
                        >
                            {isPending
                                ? t("createTenant.submitting")
                                : t("createTenant.submit")}
                        </Button>
                        {isError && (
                            <p className="text-destructive mt-2 text-center text-sm">
                                {t("createTenant.error")}
                            </p>
                        )}
                    </div>
                </form>
            </Form>
        </div>
    );
}
