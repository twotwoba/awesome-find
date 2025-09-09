import type { SearchConfig } from "./background"

/**
 * Removes all highlights from the current page.
 */
export function removePageHighlights() {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		if (tabs.length === 0 || !tabs[0]?.id) return
		chrome.scripting.executeScript({
			target: { tabId: tabs[0].id },
			func: () => {
				function removeHighlights() {
					if ((CSS as unknown as CSSWithHighlights)?.highlights) {
						try {
							CSS.highlights?.delete("awesome-find-highlight")
							CSS.highlights?.delete("awesome-find-active")
							window.__awesomeFindRanges = []
						} catch (e) {
							console.warn("Failed to clear CSS highlights", e)
						}
					}
				}
				removeHighlights()
			}
		})
	})
}

export function searchInPage(config: SearchConfig, callback: (result: number) => void) {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		if (tabs.length === 0) return
		const tab = tabs[0]
		if (!tab.id) return

		chrome.scripting.executeScript(
			{
				target: { tabId: tab.id },
				func: (config: SearchConfig) => {
					// TODO shadow DOM support or iframe support
					const { isCaseSensitive, isWholeWord, isRegexp } = config
					const keyword = config.keyword?.trim()
					if (!keyword) return 0

					/** enhighlight */
					function ensureHighlightStyles() {
						if (document.getElementById("awesome-find-highlight-style")) return
						const style = document.createElement("style")
						style.id = "awesome-find-highlight-style"
						style.textContent = `::highlight(awesome-find-highlight){background:#ffeb3b;color:#000;border-radius:2px;font-weight:700}::highlight(awesome-find-active){background:#ff9800;color:#000;border-radius:2px;font-weight:700;box-shadow:0 0 3px rgba(255,152,0,.8)}`
						document.head.appendChild(style)
					}
					/* ============== core function defined ============== */
					function createWalker() {
						const walker = document.createTreeWalker(
							document.documentElement,
							NodeFilter.SHOW_TEXT,
							{ acceptNode: (node) => (!node.nodeValue?.trim() ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT) }
						)
						return walker
					}
					function isElementVisible(element: Element): boolean {
						if (!element) return false
						const rect = element.getBoundingClientRect()
						if (rect.width <= 0 || rect.height <= 0) return false
						const style = window.getComputedStyle(element)
						if (style.display === "none" || style.visibility !== "visible" || Number(style.opacity) <= 0) return false
						if (style.clip && style.clip !== "auto" && style.clip.includes("rect(0")) return false
						const hiddenPatterns = [
							/rect\(0px, 0px, 0px, 0px\)/,
							/inset\(0% 0% 0% 0%\)/,
							/inset\(0px 0px 0px 0px\)/,
							/circle\(0px/,
							/ellipse\(0px 0px/,
							/polygon\(\)/,
							/path\(""\)/,
							/path\(''\)/
						]
						if (hiddenPatterns.some((p) => p.test(style.clipPath))) return false
						return true
					}
					function isElementSpecial(element: Element) {
						const specialTags = ["SCRIPT", "STYLE", "NOSCRIPT", "META", "HEAD", "TITLE"]
						return specialTags.includes(element.tagName)
					}
					function isTextNodeVisible(textNode: Text): boolean {
						const parent = textNode.parentElement
						if (!parent) return false
						let current: Element | null = parent
						while (current && current !== document.documentElement) {
							if (isElementSpecial(current)) return false
							if (current === parent && !isElementVisible(current)) return false
							// exclude awesome-find popover content
							if (current.id === '__inner_af-popover-content' ||
								current.closest('#__inner_af-popover-content')) return false
							current = current.parentElement
						}
						return true
					}
					function createSearchRegex(keyword: string): RegExp | null {
						try {
							let regContent = keyword
							if (!isRegexp) regContent = regContent.replace(/([^a-zA-Z0-9_ \n])/g, "\\$1")
							if (isWholeWord) regContent = `\\b${regContent}\\b`
							const flags = `g${isCaseSensitive ? "" : "i"}`
							return new RegExp(regContent, flags)
						} catch (e) {
							console.warn("create regexp error", e)
							return null
						}
					}
					function getTransformedText(text: string, element: Element): string {
						const computedStyle = window.getComputedStyle(element)
						const textTransform = computedStyle.textTransform

						switch (textTransform) {
							case 'uppercase':
								return text.toUpperCase()
							case 'lowercase':
								return text.toLowerCase()
							case 'capitalize':
								return text.replace(/\b\w/g, (char) => char.toUpperCase())
							default:
								return text
						}
					}

					function isTextMatch(text: string, keyword: string, element?: Element) {
						const regex = createSearchRegex(keyword)
						if (!regex) return false

						// If element is provided, use transformed text for matching
						const searchText = element ? getTransformedText(text, element) : text
						return regex.test(searchText)
					}

					function findAllMatches(text: string, keyword: string, element?: Element) {
						const out: Array<{ start: number; end: number; match: string; originalStart: number; originalEnd: number }> = []
						const regex = createSearchRegex(keyword)
						if (!regex) return out

						// Use transformed text for matching
						const searchText = element ? getTransformedText(text, element) : text

						let startPosition = 0
						while (startPosition < searchText.length) {
							regex.lastIndex = 0
							const remainingText = searchText.substring(startPosition)
							const res = regex.exec(remainingText)
							if (res) {
								const matchStart = res.index
								const matchLength = res[0].length
								const absoluteStart = startPosition + matchStart
								const absoluteEnd = absoluteStart + matchLength

								// Map back to original text positions
								// For simple transforms like uppercase/lowercase, positions remain the same
								// For capitalize, positions also remain the same since only case changes
								out.push({
									start: absoluteStart,
									end: absoluteEnd,
									match: res[0],
									originalStart: absoluteStart,
									originalEnd: absoluteEnd
								})
								startPosition = absoluteEnd
							} else break
						}
						return out
					}
					/* ====================== end ====================== */

					console.log("🔍 Start Searching (CSS Highlights):", keyword)

					ensureHighlightStyles()

					const walker = createWalker()
					const matchingNodes: { textNode: Text; element: Element }[] = []
					let currentNode: Node | null
					// biome-ignore lint/suspicious/noAssignInExpressions: intentional for TreeWalker pattern
					while ((currentNode = walker.nextNode())) {
						const textNode = currentNode as Text
						const text = textNode.nodeValue
						if (!text) continue
						if (!isTextNodeVisible(textNode)) continue

						const parentElement = textNode.parentElement
						if (!parentElement) continue

						if (isTextMatch(text, keyword, parentElement)) {
							matchingNodes.push({ textNode, element: parentElement })
						}
					}

					const ranges: Range[] = []
					const allMatchedTexts: string[] = []
					for (const { textNode, element } of matchingNodes) {
						const text = textNode.nodeValue || ""
						const matches = findAllMatches(text, keyword, element)
						if (matches.length === 0) continue
						for (const m of matches) {
							try {
								const r = new Range()
								// Use original text positions for range creation
								r.setStart(textNode, m.originalStart)
								r.setEnd(textNode, m.originalEnd)
								ranges.push(r)
								allMatchedTexts.push(m.match)
							} catch (e) {
								console.warn("Failed to create range", e)
							}
						}
					}

					if (ranges.length > 0) {
						const baseHighlight = new Highlight(...ranges)
						CSS.highlights.set("awesome-find-highlight", baseHighlight)
						const activeHighlight = new Highlight(ranges[0])
						CSS.highlights.set("awesome-find-active", activeHighlight)
						window.__awesomeFindRanges = ranges
						// scroll first match into view (center)
						const firstRange = ranges[0]
						const targetNode = firstRange.startContainer.nodeType === 3
							? (firstRange.startContainer as Text).parentElement
							: (firstRange.startContainer as Element)
						targetNode?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" })

					}

					// regexp mode need copy fn
					chrome.storage.session.set({ matchedTexts: config.isRegexp && allMatchedTexts.length > 0 ? allMatchedTexts : [] })

					return ranges.length
				},
				args: [config]
			},
			(results: chrome.scripting.InjectionResult<number>[]) => {
				if (chrome.runtime.lastError) {
					console.error("❌ Chrome runtime error:", chrome.runtime.lastError.message)
					callback(0)
					return
				}

				if (results?.[0]) {
					const result = results[0].result
					if (typeof result === "number") callback(result)
					else callback(0)
				} else callback(0)
			}
		)
	})
}

export function navigateToResult(
	targetIndex: number,
	callback: (result: { nextIndex: number }) => void
) {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		if (tabs.length === 0) {
			callback({ nextIndex: 0 })
			return
		}
		const tab = tabs[0]
		if (!tab.id) {
			callback({ nextIndex: 0 })
			return
		}

		chrome.scripting.executeScript(
			{
				target: { tabId: tab.id },
				func: (targetIndex: number) => {

					// CSS Highlights navigation
					const ranges: Range[] = window.__awesomeFindRanges || []
					if (!ranges.length) return { nextIndex: 0 }
					let newIndex = targetIndex
					if (newIndex < 1) newIndex = ranges.length
					if (newIndex > ranges.length) newIndex = 1

					try {
						const active = new Highlight(ranges[newIndex - 1])
						CSS.highlights.set("awesome-find-active", active)
						const activeRange = ranges[newIndex - 1]
						const targetNode = activeRange.startContainer.nodeType === 3
							? (activeRange.startContainer as Text).parentElement
							: (activeRange.startContainer as Element)
						targetNode?.scrollIntoView({ behavior: "auto", block: "center", inline: "nearest" })
					} catch (e) {
						console.warn("Failed to set active highlight", e)
					}
					return { nextIndex: newIndex }
				},
				args: [targetIndex]
			},
			(results: chrome.scripting.InjectionResult<{ nextIndex: number }>[]) => {
				if (chrome.runtime.lastError) {
					console.error("❌ Navigate to result error:", chrome.runtime.lastError.message)
					callback({ nextIndex: 0 })
					return
				}
				callback(results?.[0]?.result || { nextIndex: 0 })
			}
		)
	})
}
