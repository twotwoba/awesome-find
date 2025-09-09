import { crx } from "@crxjs/vite-plugin"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"
import zip from "vite-plugin-zip-pack"
import tsconfigPaths from "vite-tsconfig-paths"
import manifest from "./manifest.config.js"
import { name, version } from "./package.json"
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	const isProd = mode === "production"

	return {
		plugins: [
			tsconfigPaths({ loose: true }),
			react(),
			tailwindcss(),
			crx({ manifest }),
			zip({ outDir: "release", outFileName: `crx-${name}-${version}.zip` })
		],
		build: {
			sourcemap: !isProd ? "inline" : false,
			manifest: true,
			minify: "esbuild",
			rollupOptions: {
				input: {
					main: "index.html",
					// option: "option.html"
				},
				output: {
					manualChunks(id) {
						if (id.includes("node_modules")) {
							return id.toString().split("node_modules/")[1].split("/")[0].toString()
						}
					},
					chunkFileNames: "[name]-bundle.js",
					entryFileNames: "[name]-bundle.js",
					assetFileNames: "assets/[ext]/[name]-[hash].[ext]"
				}
			}
		},
		esbuild: {
			target: "es2020"
		},
		server: {
			cors: {
				origin: [/chrome-extension:\/\//]
			}
		}
	}
})
