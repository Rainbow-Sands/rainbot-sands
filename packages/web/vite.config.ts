import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";

// Load the repo-root .env for local development. Absent in production, where
// the variables come from the container environment instead.
try {
  loadEnvFile(fileURLToPath(new URL("../../.env", import.meta.url)));
} catch {
  // No root .env present; rely on the existing environment.
}

export default defineConfig({
  plugins: [sveltekit()],
});
