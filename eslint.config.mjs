import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

const config = [
    // ✅ Apply Next.js + TypeScript + Prettier
    ...compat.extends("next/core-web-vitals", "next/typescript", "plugin:prettier/recommended"),

    // ✅ Custom rules
    {
        rules: {
            "no-console": "warn",
            quotes: ["error", "double"],
            "prettier/prettier": "warn",
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],
        },
    },

    // ✅ Ignore build folders
    {
        ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"],
    },
];

export default config;
