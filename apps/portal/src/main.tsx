import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";

import { router } from "@/router";
import "@/i18n";
import "./index.css";

axios.defaults.baseURL =
    import.meta.env.VITE_API_URL || "http://localhost:3000";

const queryClient = new QueryClient();

createRoot(document.getElementById("app")!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
        </QueryClientProvider>
    </StrictMode>,
);
