import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const env = globalThis.process?.env ?? {};
const repositoryName = env.GITHUB_REPOSITORY?.split("/").pop();
const githubPagesBase = env.VITE_BASE_PATH ?? (repositoryName ? `/${repositoryName}/` : "/");

export default defineConfig({
  base: env.GITHUB_ACTIONS ? githubPagesBase : "/",
  plugins: [react()],
  server: {
    watch: {
      ignored: [
        "**/assets/**/*.mp4",
        "**/assets/**/*.webm",
        "**/public/**/*.mp4",
        "**/public/**/*.webm",
        "**/*.crdownload",
      ],
    },
  },
});
