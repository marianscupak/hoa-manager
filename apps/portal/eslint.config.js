import { baseConfig } from "@hoa-mngr/eslint-config/eslint.config.js";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import reactRefreshPlugin from "eslint-plugin-react-refresh";

export default [
    ...baseConfig,
    {
        files: ["**/*.{ts,tsx}"],
        plugins: {
            "react": reactPlugin,
            "react-hooks": reactHooksPlugin,
            "react-refresh": reactRefreshPlugin,
        },
        rules: {
            ...reactPlugin.configs.recommended.rules,
            ...reactHooksPlugin.configs.recommended.rules,
            "react-refresh/only-export-components": [
                "warn",
                { allowConstantExport: true },
            ],
            "react/react-in-jsx-scope": "off",
            // The UI package mounts the one <Toaster/>; a `toast` imported from
            // a second sonner copy has no subscriber and silently shows nothing.
            "no-restricted-imports": [
                "error",
                {
                    paths: [
                        {
                            name: "sonner",
                            message:
                                'Import { toast } from "@hoa-mngr/ui" instead.',
                        },
                    ],
                },
            ],
        },
        languageOptions: {
            globals: {
                // Browser globals
                document: "readonly",
                localStorage: "readonly",
                window: "readonly",
                console: "readonly",
                HTMLElement: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
            },
        },
        settings: {
            react: {
                version: "19.0",
            },
        },
    },
];
