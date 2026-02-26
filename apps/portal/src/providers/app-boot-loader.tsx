import { ReactNode } from "react";

import { useAuthBoot } from "@/auth/session";

export function AppBootLoader({ children }: { children: ReactNode }) {
    useAuthBoot();
    return <>{children}</>;
}
