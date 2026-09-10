import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const processEnv = globalThis.process?.env ?? {};
  const env = {
    ...processEnv,
    ...loadEnv(mode, globalThis.process?.cwd() ?? ".", ""),
  };
  const repositoryName = env.GITHUB_REPOSITORY?.split("/").pop();
  const githubPagesBase = repositoryName ? `/${repositoryName}/` : "/";
  const base = env.VITE_BASE_PATH ?? (env.GITHUB_ACTIONS ? githubPagesBase : "/");

  return {
    base,
    plugins: [react()],
  };
});
