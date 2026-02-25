import { defineConfig } from "orval";

export default defineConfig({
    api: {
        input: "../api/openapi-spec.json",
        output: {
            mode: "tags-split",
            target: "src/api/generated/endpoints.ts",
            schemas: "src/api/generated/model",
            client: "react-query",
            httpClient: "axios",
            override: {
                mutator: {
                    path: "src/api/axios.ts",
                    name: "customInstance",
                },
            },
        },
    },
});
