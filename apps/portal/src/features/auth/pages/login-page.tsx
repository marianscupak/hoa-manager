import { useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { useAuth } from "@/providers/auth-provider";

export function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // The intended destination from AuthLayout, or fallback to home
    const from = location.state?.from?.pathname || "/";
    const [submitting, setSubmitting] = useState(false);

    const handleMockLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setTimeout(() => {
            login("mock-jwt-token-replace-me", {
                id: "123",
                email: "admin@hoa.local",
                role: "ADMIN",
            });
            navigate(from, { replace: true });
        }, 800);
    };

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

            <form onSubmit={handleMockLogin} className="space-y-4">
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-900">
                        Email Address
                    </label>
                    <input
                        type="email"
                        required
                        className="focus:ring-primary block w-full rounded-md border-0 py-1.5 text-slate-900 ring-1 ring-slate-300 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
                        placeholder="admin@hoa.local"
                    />
                </div>
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-900">
                        Password
                    </label>
                    <input
                        type="password"
                        required
                        className="focus:ring-primary block w-full rounded-md border-0 py-1.5 text-slate-900 ring-1 ring-slate-300 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
                        placeholder="••••••••"
                    />
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex w-full justify-center rounded-md bg-slate-900 px-3 py-1.5 text-sm leading-6 font-semibold text-white shadow-sm hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:opacity-50"
                    >
                        {submitting ? "Signing in..." : "Sign in (Mock)"}
                    </button>
                </div>
            </form>
        </div>
    );
}
