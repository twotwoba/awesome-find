import { defineManifest } from "@crxjs/vite-plugin"
import packageJson from "./package.json"

export default defineManifest({
	manifest_version: 3,
	version: packageJson.version,
	name: packageJson.name,
	description: packageJson.description,
	author: {
		email: "ericyuanovo@gmail.com"
	},
	permissions: ["storage", "tabs", "scripting", "activeTab"],
	host_permissions: ["<all_urls>"],
	icons: {
		16: "icon-16.png",
		32: "icon-32.png",
		64: "icon-64.png"
	},
	action: {
		default_icon: {
			64: "icon-64.png"
		}
	},
	background: {
		service_worker: "src/core/background.ts",
		type: "module"
	},
	content_scripts: [
		{
			matches: ["<all_urls>"],
			js: ["src/core/content-script.tsx"],
			run_at: "document_start"
		}
	],
	commands: {
		_execute_action: {
			suggested_key: {
				windows: "Alt+F",
				mac: "Alt+F",
				linux: "Alt+F"
			}
		}
	}
})
