import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";

dotenv.config(); // Load variables from .env file

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_Genesys_OIDC_CLIENT_ID': JSON.stringify(process.env.VITE_Genesys_OIDC_CLIENT_ID),
    'import.meta.env.VITE_Genesys_OIDC_CLIENT_SECRET': JSON.stringify(process.env.VITE_Genesys_OIDC_CLIENT_SECRET),
    'import.meta.env.VITE_GENOLINK_SERVER': JSON.stringify(process.env.VITE_GENOLINK_SERVER),
    'import.meta.env.VITE_GENESYS_SERVER': JSON.stringify(process.env.VITE_GENESYS_SERVER),
  },
  server: {
    host: process.env.VITE_FRONTEND_DEV_HOST || "127.0.0.1",
    port: parseInt(process.env.VITE_FRONTEND_DEV_PORT, 10) || 3000,
  }
});
