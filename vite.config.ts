import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: [".trycloudflare.com"],
    proxy: {
      "/api": "http://127.0.0.1:5000",
      "/login": "http://127.0.0.1:5000",
      "/register": "http://127.0.0.1:5000",
      "/get_analytics": "http://127.0.0.1:5000",
      "/get_results": "http://127.0.0.1:5000",
      "/get_student_marks": "http://127.0.0.1:5000",
      "/fetch_results": "http://127.0.0.1:5000",
      "/upload_list": "http://127.0.0.1:5000",
      "/reset_data": "http://127.0.0.1:5000",
      "/download_pdf": "http://127.0.0.1:5000",
      "/view_pdf": "http://127.0.0.1:5000",
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
