import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importX from "eslint-plugin-import-x";

export const baseConfig = tseslint.config({
    files: ["**/*.{ts,tsx}"],
    extends: [
        js.configs.recommended,
        ...tseslint.configs.recommended,
        importX.flatConfigs.recommended,
        importX.flatConfigs.typescript,
    ],
    languageOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
    settings: {
        "import-x/resolver": {
            typescript: true,
            node: true,
        },
    },
    rules: {
        "@typescript-eslint/no-unused-vars": [
            "error",
            {
                argsIgnorePattern: "^_",
                varsIgnorePattern: "^_",
            },
        ],
        "@typescript-eslint/no-non-null-assertion": "off",
        "import-x/order": [
            "warn",
            {
                "groups": [
                    "builtin",
                    "external",
                    "internal",
                    ["parent", "sibling", "index"],
                ],
                "pathGroups": [
                    {
                        pattern: "@hoa-mngr/**",
                        group: "internal",
                        position: "before",
                    },
                    {
                        pattern: "@/**",
                        group: "internal",
                        position: "after",
                    },
                ],
                "pathGroupsExcludedImportTypes": ["builtin"],
                "newlines-between": "always",
                "alphabetize": {
                    order: "asc",
                    caseInsensitive: true,
                },
            },
        ],
        "import-x/no-duplicates": "warn",
        "import-x/no-named-as-default-member": "off",
    },
});

export default baseConfig;
