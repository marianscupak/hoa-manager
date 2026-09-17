import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Form, FormInput, Button } from "@hoa-mngr/ui";

import { GoogleLoginButton } from "../components/google-login-button";
import { useLogin } from "../hooks/use-login";

export function LoginPage() {
    const { t } = useTranslation("auth");
    const { form, handleLogin, isPending } = useLogin();

    return (
        <div className="bg-card w-full rounded-xl border p-8 px-6 shadow-sm sm:px-10">
            <div className="mb-6 text-center">
                <h1 className="text-foreground text-2xl font-bold tracking-tight">
                    {t("loginPage.title")}
                </h1>
                <p className="text-muted-foreground mt-2 text-sm">
                    {t("loginPage.subtitle")}
                </p>
            </div>

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(handleLogin)}
                    className="space-y-4"
                >
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
                                ? t("loginPage.submitting")
                                : t("loginPage.submit")}
                        </Button>
                    </div>
                </form>
            </Form>

            <div className="mt-6 flex items-center justify-center">
                <span className="bg-card text-muted-foreground px-2 text-sm">
                    {t("loginPage.dividerOauth")}
                </span>
            </div>

            <div className="mt-6">
                <GoogleLoginButton disabled={isPending} />
            </div>

            <p className="text-muted-foreground mt-6 text-center text-sm">
                {t("loginPage.noAccount")}{" "}
                <Link to="/register" className="text-primary font-medium">
                    {t("loginPage.register")}
                </Link>
            </p>
        </div>
    );
}
