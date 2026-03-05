import { Form, FormInput, Button } from "@hoa-mngr/ui";

import { GoogleLoginButton } from "../components/google-login-button";
import { useLogin } from "../hooks/use-login";

// TODO: Add translations
export function LoginPage() {
    const { form, handleLogin, isPending, isError } = useLogin();

    return (
        <div className="bg-card w-full rounded-xl border p-8 px-6 shadow-sm sm:px-10">
            <div className="mb-6 text-center">
                <h1 className="text-foreground text-2xl font-bold tracking-tight">
                    Sign in
                </h1>
                <p className="text-muted-foreground mt-2 text-sm">
                    Welcome to the HOA Manager portal.
                </p>
            </div>

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(handleLogin)}
                    className="space-y-4"
                >
                    <FormInput
                        name="email"
                        label="Email Address"
                        type="email"
                        placeholder="admin@hoa.local"
                        disabled={isPending}
                    />
                    <FormInput
                        name="password"
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        disabled={isPending}
                    />

                    <div className="pt-2">
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="w-full"
                        >
                            {isPending ? "Signing in..." : "Sign in"}
                        </Button>
                        {isError && (
                            <p className="text-destructive mt-2 text-center text-sm">
                                Login failed. Please check your credentials.
                            </p>
                        )}
                    </div>
                </form>
            </Form>

            <div className="mt-6 flex items-center justify-center">
                <span className="bg-card text-muted-foreground px-2 text-sm">
                    Or continue with
                </span>
            </div>

            <div className="mt-6">
                <GoogleLoginButton disabled={isPending} />
            </div>
        </div>
    );
}
