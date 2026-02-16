import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = __dirname;
const SHARED_DATA_DIR = path.resolve(__dirname, "../shared-data");

const rawBase = process.env.BASE_PATH || process.env.VITE_BASE_PATH || "";
const BASE_PATH = rawBase.replace(/\/+$/, "");
const VITE_BASE_FOR_BUILD = BASE_PATH ? `${BASE_PATH}/` : "/";

export default defineConfig(({ mode }) => ({
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
    host: process.env.VITE_FRONTEND_DEV_HOST || "127.0.0.1",
    port: parseInt(process.env.VITE_FRONTEND_DEV_PORT, 10) || 3001,
    fs: {
      allow: [ROOT_DIR, SHARED_DATA_DIR],
    },
  },
}));
