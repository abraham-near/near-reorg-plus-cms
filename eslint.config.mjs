import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// The CMS (src/cms, src/app/(cms)) and the site share only the project and the database
// (src/generated/prisma). Neither imports the other.
const SITE_FILES = ["src/app/(site)/**", "src/components/**", "src/lib/**", "src/styles/**"];
const CMS_FILES = ["src/cms/**", "src/app/(cms)/**", "src/proxy.ts", "scripts/cms-*.ts", "tests/**"];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: SITE_FILES,
    rules: {
      "no-restricted-imports": ["error", { patterns: [{ group: ["@/cms", "@/cms/*", "**/cms/**", "**/(cms)/**"], message: "The site must not import the CMS. Read the database instead (src/generated/prisma)." }] }],
    },
  },
  {
    files: CMS_FILES,
    rules: {
      "no-restricted-imports": ["error", { patterns: [{ group: ["@/components/*", "@/lib/*", "@/styles/*", "**/(site)/**"], message: "The CMS must not import the site. Keep CMS code in src/cms." }] }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated frozen copies of earlier versions (D39)
    "public/versions/**",
    // Prisma client (prisma generate)
    "src/generated/**",
  ]),
]);

export default eslintConfig;
