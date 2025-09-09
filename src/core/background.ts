import { isPureRegexMatching } from "@/lib/safe-regexp"
import { navigateToResult, removePageHighlights, searchInPage } from "./tool"

// background.ts - Service Worker for Chrome Extension
console.log("====== background script start ======")

export type SearchConfig = {
	keyword: string
	isCaseSensitive: boolean
	isWholeWord: boolean
	isRegexp: boolean
}
const defaultSettings: SearchConfig = {
	keyword: "",
	isCaseSensitive: false,
	isWholeWord: false,
	isRegexp: false
}

/**
 * onInstalled hook
 * This is triggered when the extension is installed or updated.
 */
chrome.runtime.onInstalled.addListener(({ reason }) => {
	// This is a new installation, do something like showing a welcome message
	if (reason === "install") {
		chrome.storage.local.set(defaultSettings)
		chrome.storage.session.setAccessLevel({ accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS" })
	}
})

/**
 * onClicked hook
 * This is triggered when the extension icon is clicked
 */
chrome.action.onClicked.addListener(async (tab) => {
	await chrome.tabs.sendMessage(tab.id!, { action: "TOGGLE_POPUP" })
})

/**
 * onMessage hook
 * This is triggered when messages are sent from content scripts or popup scripts
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	if (message.action === "__af_search") {
		removePageHighlights()
		handleSearchRequest(message.state, sendResponse)
		return true
	}

	if (message.action === "__af_remove_highlights") {
		removePageHighlights()
		return true
	}

	if (message.action === "__af_go_prev") {
		navigateToResult(message.currentIndex - 1, sendResponse)
		return true
	}

	if (message.action === "__af_go_next") {
		navigateToResult(message.currentIndex + 1, sendResponse)
		return true
	}

	return false
})

/**
 * Handle search requests from popup
 * @param config       Search configuration
 * @param sendResponse Function to send response back to the sender
 */
async function handleSearchRequest(
	config: SearchConfig,
	sendResponse: (response: any) => void
) {
	try {
		if (config.keyword.trim() === "") {
			sendResponse({ found: 0 })
			return
		}

		if (config.isRegexp && !isPureRegexMatching(config.keyword)) {
			// invalid regexp pattern, do not search
			console.log("⚠️ - invalid regexp pattern, do not search")
			sendResponse({
				found: 0
			})
			return
		}

		console.log("🔍 [DEBUG] Search config:", config)

		searchInPage(config, (result) => {
			sendResponse({ found: result })
		})
	} catch (_error) {
		sendResponse({ found: 0 })
	}
}

/**
 * anything else you want to do on background script
 * ...
 */

console.log("====== background script loaded ======")
