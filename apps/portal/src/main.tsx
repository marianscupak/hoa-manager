import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";

import "@/api/axios";
import "@/i18n";
import { AppBootLoader } from "@/providers/app-boot-loader";
import { router } from "@/router";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("app")!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <AppBootLoader>
                <RouterProvider router={router} />
            </AppBootLoader>
        </QueryClientProvider>
    </StrictMode>,
);
