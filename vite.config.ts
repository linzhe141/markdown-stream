import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
export default defineConfig({
  build: {
    lib: {
      entry: "./src/index.ts",
    },
    minify: false,
    rollupOptions: {
      output: [
        {
          format: "es",
          entryFileNames: "[name].js",
          preserveModules: true,
          exports: "named",
          dir: "./dist",
        },
      ],
    },
  },
  plugins: [dts()],
});
