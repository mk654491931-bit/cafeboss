import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const port = process.env.PORT ? Number(process.env.PORT) : 5173;

export default defineConfig({
  plugins: [react()],
  // Expose the Supabase connection to the client. Narrow prefixes keep
  // SUPABASE_SERVICE_ROLE_KEY (and anything else) out of the bundle.
  envPrefix: ["VITE_", "SUPABASE_URL", "SUPABASE_ANON_KEY"],
  server: {
    host: "0.0.0.0",
    port,
    strictPort: false,
    hmr: false,
    // The workspace preview is served on its own hostname.
    allowedHosts: true,
  },
  preview: {
    host: "0.0.0.0",
    port,
    strictPort: false,
    allowedHosts: true,
  },
});
