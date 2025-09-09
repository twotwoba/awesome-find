// content-script.ts(x) - Content script for Chrome Extension
import { createRoot } from "react-dom/client"
import ShadowDom from "@/components/shadow-dom"
import Popup from "./popup"
import PopupManager from "./popup/popup-manager"

let root: ReturnType<typeof createRoot> | null = null
let popupManager = new PopupManager()

/**
 * Popup controller functions
 * These functions handle mounting and unmounting the popup component in the shadow DOM.
 */
export const mountPopup = (event: CustomEvent<string | undefined>) => {
	// selectedText selected text to populate the popup input field.
	const selectedText = event?.detail

	const hostElement = document.createElement("div")
	hostElement.id = PopupManager.Id
	hostElement.style = `
		position: absolute;
		z-index: 2147483647; // max z-index
	`
	document.documentElement.appendChild(hostElement)
	root = createRoot(hostElement)
	root.render(
		<ShadowDom>
			<Popup selectedText={selectedText} />
		</ShadowDom>
	)
}
export const unmountPopup = () => {
	root?.unmount()
	document.getElementById(PopupManager.Id)?.remove()
}

// listen for custom events from other scripts
document.addEventListener("AF_MOUNT_POPUP", mountPopup)
document.addEventListener("AF_UNMOUNT_POPUP", unmountPopup)

// listen for messages from background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	if (message.action === "TOGGLE_POPUP") {
		if (!popupManager) {
			popupManager = new PopupManager()
		}
		const selectedText = window.getSelection()?.toString()
		popupManager.toggle(selectedText)
		sendResponse({ success: true })
	}

	// keep the message channel open
	return true
})

console.log("Content script has loaded in:", window.location.href)
