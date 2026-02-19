import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite"; // <--- Importe isso
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tailwindcss(), // <--- Adicione aqui
    reactRouter(),
    tsconfigPaths(),
  ],
});
