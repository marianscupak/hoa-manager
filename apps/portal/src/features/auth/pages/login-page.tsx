import { useSetAtom } from "jotai";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { useAuthControllerLogin } from "@/api/generated/auth/auth";
import {
    accessTokenAtom,
    authStatusAtom,
    tenantContextAtom,
    userAtom,
} from "@/auth/atoms";
import { parseJwt } from "@/auth/jwt";
import { STORAGE_KEYS } from "@/storage/keys";
import { StorageService } from "@/storage/storage";

import { GoogleLoginButton } from "../components/google-login-button";

export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const setAccessToken = useSetAtom(accessTokenAtom);
    const setAuthStatus = useSetAtom(authStatusAtom);
    const setTenantContext = useSetAtom(tenantContextAtom);
    const setUser = useSetAtom(userAtom);

    // The intended destination from AuthLayout, or fallback to home
    const from = location.state?.from?.pathname || "/";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const loginMutation = useAuthControllerLogin();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        loginMutation.mutate(
            { data: { email, password } },
            {
                onSuccess: (data) => {
                    const token = data.accessToken;
                    const payload = parseJwt(token);
                    if (!payload) return;

                    setAccessToken(token);
                    setUser({ userId: payload.sub, email: payload.email });

                    if (payload.tid && payload.mid) {
                        setTenantContext({
                            tenantId: payload.tid,
                            membershipId: payload.mid,
                            roles: payload.roles || [],
                        });
                        setAuthStatus("authenticated");
                        StorageService.setString(
                            STORAGE_KEYS.LAST_TENANT_ID,
                            payload.tid,
                        );
                        navigate(from, { replace: true });
                    } else {
                        setAuthStatus("select-tenant");
                        navigate("/select-tenant", { replace: true });
                    }
                },
            },
        );
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

            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-900">
                        Email Address
                    </label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="focus:ring-primary block w-full rounded-md border-0 py-1.5 text-slate-900 ring-1 ring-slate-300 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
                        placeholder="admin@hoa.local"
                        disabled={loginMutation.isPending}
                    />
                </div>
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-900">
                        Password
                    </label>
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="focus:ring-primary block w-full rounded-md border-0 py-1.5 text-slate-900 ring-1 ring-slate-300 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
                        placeholder="••••••••"
                        disabled={loginMutation.isPending}
                    />
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loginMutation.isPending}
                        className="flex w-full justify-center rounded-md bg-slate-900 px-3 py-1.5 text-sm leading-6 font-semibold text-white shadow-sm hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:opacity-50"
                    >
                        {loginMutation.isPending ? "Signing in..." : "Sign in"}
                    </button>
                    {loginMutation.isError && (
                        <p className="mt-2 text-center text-sm text-red-500">
                            Login failed. Please check your credentials.
                        </p>
                    )}
                </div>
            </form>

            <div className="mt-6 flex items-center justify-center">
                <span className="bg-white px-2 text-sm text-slate-500">
                    Or continue with
                </span>
            </div>

            <div className="mt-6">
                <GoogleLoginButton disabled={loginMutation.isPending} />
            </div>
        </div>
    );
}
