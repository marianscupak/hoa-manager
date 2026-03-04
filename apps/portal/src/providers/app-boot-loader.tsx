import { useAtomValue } from "jotai";
import { ReactNode } from "react";

import { authStatusAtom } from "@/auth/atoms";
import { useAuthBoot } from "@/auth/session";

export function AppBootLoader({ children }: { children: ReactNode }) {
    useAuthBoot();
    const authStatus = useAtomValue(authStatusAtom);

    if (authStatus === "initializing") {
        return (
            <div className="bg-muted flex min-h-screen items-center justify-center">
                <p className="text-muted-foreground animate-pulse">
                    Loading application...
                </p>
            </div>
        );
    }

    return <>{children}</>;
}
