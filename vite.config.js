import { fileURLToPath, URL } from "node:url";
import process from "node:process";

import { defineConfig } from "vite";
import { createHtmlPlugin } from "vite-plugin-html";
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
    ],
    createHtmlPlugin({
      inject: {
        data: { BASE_URL: process.env.CF_PAGES_URL ?? "http://localhost:5173" },
      },
    }),
  ],
  build: {
    cssCodeSplit: false,
    lib: {
      entry: "./src/index.js",
      formats: ["cjs"],
      name: "@vue-stripe/vue-stripe",
      fileName: "index",
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
