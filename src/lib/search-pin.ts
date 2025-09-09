/**
 * Search pin management utilities
 */
const STORAGE_KEY = '__af_search_pin'
const MAX_PIN_SIZE = 5

/**
 * Get search pin from storage
 */
export async function getSearchPin(): Promise<SearchItem[]> {
    return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
            const pin = result[STORAGE_KEY] || []
            resolve(pin)
        })
    })
}

/**
 * Add a new search item to pin
 */
export async function addToSearchPin(item: SearchItem): Promise<void> {
    const pin = await getSearchPin()

    // Remove existing item with same keyword (avoid duplicates)
    const filteredHistory = pin.filter(h => h.keyword !== item.keyword)

    // Add new item to the beginning
    const newHistory = [item, ...filteredHistory].slice(0, MAX_PIN_SIZE)

    return new Promise((resolve) => {
        chrome.storage.local.set({ [STORAGE_KEY]: newHistory }, () => {
            resolve()
        })
    })
}

/**
 * Remove a specific item from search pin
 */
export async function removeFromSearchPin(keyword: string): Promise<void> {
    const pin = await getSearchPin()
    const filteredPin = pin.filter(h => h.keyword !== keyword)

    return new Promise((resolve) => {
        chrome.storage.local.set({ [STORAGE_KEY]: filteredPin }, () => {
            resolve()
        })
    })
}

/**
 * Clear all search pin
 */
export async function clearSearchPin(): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.local.remove([STORAGE_KEY], () => {
            resolve()
        })
    })
}