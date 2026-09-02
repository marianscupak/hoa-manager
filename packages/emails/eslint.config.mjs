import { baseConfig } from "@hoa-mngr/eslint-config/eslint.config.js";
import reactPlugin from "eslint-plugin-react";

export default [
    ...baseConfig,
    {
        files: ["**/*.{ts,tsx}"],
        plugins: {
            react: reactPlugin,
        },
        rules: {
            ...reactPlugin.configs.recommended.rules,
            "react/react-in-jsx-scope": "off",
            "react/prop-types": "off",
        },
        languageOptions: {
            globals: {
                console: "readonly",
                process: "readonly",
                require: "readonly",
            },
        },
        settings: {
            react: {
                version: "19.0",
            },
        },
    },
];
