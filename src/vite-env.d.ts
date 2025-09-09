/// <reference types="vite/client" />

declare global {
	interface SearchItem {
		keyword: string
		isCaseSensitive: boolean
		isWholeWord: boolean
		isRegexp: boolean
	}

	interface DocumentEventMap {
		"AF_MOUNT_POPUP": CustomEvent<string | undefined>;
		"AF_UNMOUNT_POPUP": CustomEvent<void>;
	}

	interface Window { __awesomeFindRanges?: Range[] }

	interface CSSWithHighlights { highlights?: Map<string, any> & { set: (...args: any[]) => any; get: (...args: any[]) => any; delete: (...args: any[]) => any } }

}

export { }
