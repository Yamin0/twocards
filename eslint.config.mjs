import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Hors de l'application : outillage local et dossiers qui ont leur
    // propre chaîne (film du héros, app mobile, supports commerciaux).
    ".claude/**",
    ".agents/**",
    "dashboard-video/**",
    "video/**",
    "mobile/**",
    "supabase/functions/**",
    "outreach/**",
    "presentation/**",
    "design-system/**",
    "carte-de-visite/**",
    "marrakech-best-of/**",
    "stitch/**",
  ]),
]);

export default eslintConfig;
