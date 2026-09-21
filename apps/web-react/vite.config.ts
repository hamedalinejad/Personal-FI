import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const rootSrc = path.resolve(repoRoot, "src");
const rootNm = path.resolve(repoRoot, "node_modules");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@pf": rootSrc,
      "@pf/platform": path.resolve(rootSrc, "platform"),
      "@pf/application": path.resolve(rootSrc, "application"),
      "@pf/core": path.resolve(rootSrc, "core"),
      "@pf/features": path.resolve(rootSrc, "features"),
      "decimal.js": path.resolve(rootNm, "decimal.js"),
    },
    extensions: [".mjs", ".js", ".ts", ".tsx", ".json"],
    dedupe: ["decimal.js"],
  },
  server: {
    port: 5173,
    fs: {
      allow: [repoRoot],
    },
  },
  optimizeDeps: {
    include: ["sql.js", "decimal.js"],
  },
  build: {
    target: "esnext",
    commonjsOptions: { transformMixedEsModules: true },
  },
});
