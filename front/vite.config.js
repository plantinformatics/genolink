import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";

dotenv.config();

const rawBase = process.env.BASE_PATH || "";
const BASE_PATH = rawBase.replace(/\/+$/, "");
const VITE_BASE_FOR_BUILD = BASE_PATH ? `${BASE_PATH}/` : "/";

export default defineConfig({
  base: VITE_BASE_FOR_BUILD,
  plugins: [react()],
  define: {
    __BASE_PATH__: JSON.stringify(BASE_PATH),

    "import.meta.env.VITE_Genesys_OIDC_CLIENT_ID": JSON.stringify(
      process.env.VITE_Genesys_OIDC_CLIENT_ID
    ),
    "import.meta.env.VITE_Genesys_OIDC_CLIENT_SECRET": JSON.stringify(
      process.env.VITE_Genesys_OIDC_CLIENT_SECRET
    ),
    "import.meta.env.VITE_GENOLINK_SERVER": JSON.stringify(
      process.env.VITE_GENOLINK_SERVER
    ),
    "import.meta.env.VITE_GENESYS_SERVER": JSON.stringify(
      process.env.VITE_GENESYS_SERVER
    ),
  },
  server: {
    host: process.env.VITE_FRONTEND_DEV_HOST || "127.0.0.1",
    port: parseInt(process.env.VITE_FRONTEND_DEV_PORT, 10) || 3001,
  },
});
