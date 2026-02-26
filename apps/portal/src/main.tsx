import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";

import { AuthProvider } from "@/providers/auth-provider";
import { router } from "@/router";
import "@/i18n";
import "./index.css";
import "@/api/axios";

const queryClient = new QueryClient();

createRoot(document.getElementById("app")!).render(
    <StrictMode>
        <AuthProvider>
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
            </QueryClientProvider>
        </AuthProvider>
    </StrictMode>,
);
