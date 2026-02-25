module.exports = {
  env: {
    node: true,
  },
  parser: "@typescript-eslint/parser",
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "prettier",
  ],
  plugins: ["@typescript-eslint", "import"],
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2020,
  },
  settings: {
    "import/resolver": {
      typescript: true,
      node: true,
    },
  },
  rules: {
    "@typescript-eslint/no-non-null-assertion": "off",
    "import/order": [
      "warn",
      {
        groups: [
          "builtin",      // node:fs, node:path …
          "external",     // react, i18next …
          "internal",     // @hoa-mngr/*
          ["parent", "sibling", "index"], // ../ and ./
        ],
        pathGroups: [
          {
            // Treat @hoa-mngr/* as internal (monorepo packages)
            pattern: "@hoa-mngr/**",
            group: "internal",
            position: "before",
          },
          {
            // Treat @/* absolute aliases as their own group after internal
            pattern: "@/**",
            group: "internal",
            position: "after",
          },
        ],
        pathGroupsExcludedImportTypes: ["builtin"],
        "newlines-between": "always",
        alphabetize: {
          order: "asc",
          caseInsensitive: true,
        },
      },
    ],
    "import/no-duplicates": "warn",
    "import/no-named-as-default-member": "off",
  },
};
