import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": new URL("./src", import.meta.url).pathname,
        },
    },
    server: {
        proxy: {
            "/api": {
                target: "http://127.0.0.1:3000",
                changeOrigin: true,
            },
        },
    },
    test: {
        // `src/config/env.ts` validates the frontend environment the moment it
        // is imported, and a test that reaches any API client pulls it in. On
        // a developer's machine `.env.local` satisfies it; CI has no env file,
        // so the same tests threw there and nowhere else. The value is never
        // called in a test — it only has to exist.
        env: {
            VITE_API_URL: "http://localhost:3000",
        },
    },
});
