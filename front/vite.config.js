import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = __dirname;
const SHARED_DATA_DIR = path.resolve(__dirname, "../shared-data");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const rawBase = env.BASE_PATH || env.VITE_BASE_PATH || "";
  const BASE_PATH = rawBase.replace(/\/+$/, "");
  const allowedHosts = env.VITE_FRONTEND_ALLOWED_HOSTS
    ? env.VITE_FRONTEND_ALLOWED_HOSTS.split(",")
        .map((host) => host.trim())
        .filter(Boolean)
    : [];

  const VITE_BASE_FOR_BUILD = BASE_PATH ? `${BASE_PATH}/` : "/";

  return {
    base: mode === "development" ? "/dev/" : VITE_BASE_FOR_BUILD,

    plugins: [react()],

    resolve: {
      alias: {
        "shared-data": SHARED_DATA_DIR,
      },
    },

    define: {
      __BASE_PATH__: JSON.stringify(BASE_PATH),
    },

    server: {
      host: env.VITE_FRONTEND_DEV_HOST || "127.0.0.1",
      port: parseInt(env.VITE_FRONTEND_DEV_PORT, 10) || 3001,
      allowedHosts,
      fs: {
        allow: [ROOT_DIR, SHARED_DATA_DIR],
      },
    },
  };
});
