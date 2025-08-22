import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        port: 5173,
        proxy: {
            "/api": "http://localhost:3000",
            "/config": "http://localhost:3000",
            "/data": "http://localhost:3000",
            "/describe": "http://localhost:3000",
        },
    },
    build: {
        outDir: "dist",
    },
});
