import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // GitHub Pages serves a project site from /<repo-name>/, not /. Local dev and the app's
  // own tests still run at root; only the Pages deploy workflow sets GITHUB_PAGES.
  base: process.env.GITHUB_PAGES ? "/your-economics-year/" : "/",
  plugins: [react()],
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
