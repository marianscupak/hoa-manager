import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";

import { Toaster } from "@hoa-mngr/ui";

import "@/api/axios";
import "@/i18n";
import { AppBootLoader } from "@/providers/app-boot-loader";
import { router } from "@/router";
import "./index.css";

const FIVE_MINUTES = 1000 * 60 * 5;

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: FIVE_MINUTES,
        },
    },
});

createRoot(document.getElementById("app")!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <AppBootLoader>
                <RouterProvider router={router} />
                <Toaster />
            </AppBootLoader>
        </QueryClientProvider>
    </StrictMode>,
);
