import { useTranslation } from "react-i18next";
import { Navigate, useLocation } from "react-router";

import { Form, FormInput, Button } from "@hoa-mngr/ui";

import { useVerifyEmail } from "../hooks/use-verify-email";

export function VerifyEmailPage() {
    const { t } = useTranslation("auth");
    const location = useLocation();
    const email = (location.state as { email?: string } | null)?.email ?? "";

    const { form, handleVerify, resend, isPending, isResending, cooldown } =
        useVerifyEmail(email);

    if (!email) {
        return <Navigate to="/register" replace />;
    }

    return (
        <div className="bg-card w-full rounded-xl border p-8 px-6 shadow-sm sm:px-10">
            <div className="mb-6 text-center">
                <h1 className="text-foreground text-2xl font-bold tracking-tight">
                    {t("verifyEmail.title")}
                </h1>
                <p className="text-muted-foreground mt-2 text-sm">
                    {t("verifyEmail.subtitle", { email })}
                </p>
            </div>

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(handleVerify)}
                    className="space-y-4"
                >
                    <FormInput
                        name="code"
                        label={t("verifyEmail.codeLabel")}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        placeholder="000000"
                        disabled={isPending}
                    />

                    <Button
                        type="submit"
                        disabled={isPending}
                        className="w-full"
                    >
                        {isPending
                            ? t("verifyEmail.submitting")
                            : t("verifyEmail.submit")}
                    </Button>
                </form>
            </Form>

            <div className="mt-6 text-center">
                <Button
                    variant="ghost"
                    onClick={resend}
                    disabled={isResending || cooldown > 0}
                    className="cursor-pointer"
                >
                    {cooldown > 0
                        ? t("verifyEmail.resendIn", { seconds: cooldown })
                        : t("verifyEmail.resend")}
                </Button>
            </div>
        </div>
    );
}
