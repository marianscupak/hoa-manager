import { useAtomValue } from "jotai";
import { ReactNode } from "react";

import { authStatusAtom } from "@/auth/atoms";
import { useAuthBoot } from "@/auth/session";

export function AppBootLoader({ children }: { children: ReactNode }) {
    useAuthBoot();
    const authStatus = useAtomValue(authStatusAtom);

    if (authStatus === "initializing") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <p className="animate-pulse text-slate-500">
                    Loading application...
                </p>
            </div>
        );
    }

    return <>{children}</>;
}
