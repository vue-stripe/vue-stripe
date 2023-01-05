import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
// import typescript2 from "rollup-plugin-typescript2";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    [
      vue(),
      // typescript2({
      //   check: false,
      //   include: ["./src/*.vue"],
      //   tsconfigOverride: {
      //     compilerOptions: {
      //       sourceMap: true,
      //       declaration: true,
      //       declarationMap: true,
      //     },
      //     exclude: ["vite.config.ts"],
      //   },
      // }),
    ]
  ],
  build: {
    cssCodeSplit: false,
    lib: {
      entry: "./src/index.js",
      name: "@james090500/vue-stripe",
      fileName: "vue-stripe",
    },
    rollupOptions: {
      external: ["vue"],
      output: {
        globals: {
          vue: "Vue",
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
