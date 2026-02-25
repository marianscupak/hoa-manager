import { z } from "zod";

const envSchema = z.object({
    VITE_API_URL: z.string().min(1, "VITE_API_URL is required"),
});

const _env = envSchema.safeParse(import.meta.env);

if (!_env.success) {
    throw new Error("Invalid frontend environment variables");
}

export const env = _env.data;
