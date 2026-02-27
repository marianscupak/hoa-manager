import { Form, FormInput } from "@hoa-mngr/ui";

import { GoogleLoginButton } from "../components/google-login-button";
import { useLogin } from "../hooks/use-login";

export function LoginPage() {
    const { form, handleLogin, isPending, isError } = useLogin();

    return (
        <div className="w-full rounded-xl border border-slate-200 bg-white p-8 px-6 shadow-sm sm:px-10">
            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Sign in
                </h1>
                <p className="mt-2 text-sm text-slate-500">
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
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex w-full justify-center rounded-md bg-slate-900 px-3 py-1.5 text-sm leading-6 font-semibold text-white shadow-sm hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:opacity-50"
                        >
                            {isPending ? "Signing in..." : "Sign in"}
                        </button>
                        {isError && (
                            <p className="mt-2 text-center text-sm text-red-500">
                                Login failed. Please check your credentials.
                            </p>
                        )}
                    </div>
                </form>
            </Form>

            <div className="mt-6 flex items-center justify-center">
                <span className="bg-white px-2 text-sm text-slate-500">
                    Or continue with
                </span>
            </div>

            <div className="mt-6">
                <GoogleLoginButton disabled={isPending} />
            </div>
        </div>
    );
}
