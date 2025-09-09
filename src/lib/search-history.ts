/**
 * Search history management utilities
 */
const STORAGE_KEY = '__af_search_history'
const MAX_HISTORY_SIZE = 20

/**
 * Get search history from storage
 */
export async function getSearchHistory(): Promise<SearchItem[]> {
    return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
            const history = result[STORAGE_KEY] || []
            resolve(history)
        })
    })
}

/**
 * Add a new search item to history
 */
export async function addToSearchHistory(item: SearchItem): Promise<void> {
    const history = await getSearchHistory()

    // Remove existing item with same keyword (avoid duplicates)
    const filteredHistory = history.filter(h => h.keyword !== item.keyword)

    // Add new item to the beginning
    const newHistory = [item, ...filteredHistory].slice(0, MAX_HISTORY_SIZE)

    return new Promise((resolve) => {
        chrome.storage.local.set({ [STORAGE_KEY]: newHistory }, () => {
            resolve()
        })
    })
}

/**
 * Remove a specific item from search history
 */
export async function removeFromSearchHistory(keyword: string): Promise<void> {
    const history = await getSearchHistory()
    const filteredHistory = history.filter(h => h.keyword !== keyword)

    return new Promise((resolve) => {
        chrome.storage.local.set({ [STORAGE_KEY]: filteredHistory }, () => {
            resolve()
        })
    })
}

/**
 * Clear all search history
 */
export async function clearSearchHistory(): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.local.remove([STORAGE_KEY], () => {
            resolve()
        })
    })
}
