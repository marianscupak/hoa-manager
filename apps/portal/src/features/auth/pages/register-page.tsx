import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Form, FormInput, Button } from "@hoa-mngr/ui";

import { useRegister } from "../hooks/use-register";

export function RegisterPage() {
    const { t } = useTranslation("auth");
    const { form, handleRegister, isPending } = useRegister();

    return (
        <div className="bg-card w-full rounded-xl border p-8 px-6 shadow-sm sm:px-10">
            <div className="mb-6 text-center">
                <h1 className="text-foreground text-2xl font-bold tracking-tight">
                    {t("registerPage.title")}
                </h1>
                <p className="text-muted-foreground mt-2 text-sm">
                    {t("registerPage.subtitle")}
                </p>
            </div>

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(handleRegister)}
                    className="space-y-4"
                >
                    <FormInput
                        name="fullName"
                        label={t("registerPage.nameLabel")}
                        placeholder={t("registerPage.namePlaceholder")}
                        disabled={isPending}
                    />
                    <FormInput
                        name="email"
                        label={t("loginPage.emailLabel")}
                        type="email"
                        placeholder={t("loginPage.emailPlaceholder")}
                        disabled={isPending}
                    />
                    <FormInput
                        name="password"
                        label={t("loginPage.passwordLabel")}
                        type="password"
                        revealLabel={t("loginPage.passwordReveal")}
                        hideLabel={t("loginPage.passwordHide")}
                        disabled={isPending}
                    />

                    <div className="pt-2">
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="w-full"
                        >
                            {isPending
                                ? t("registerPage.submitting")
                                : t("registerPage.submit")}
                        </Button>
                    </div>
                </form>
            </Form>

            <p className="text-muted-foreground mt-6 text-center text-sm">
                {t("registerPage.haveAccount")}{" "}
                <Link to="/login" className="text-primary font-medium">
                    {t("registerPage.signIn")}
                </Link>
            </p>
        </div>
    );
}
