import { motion, useDragControls } from "motion/react"
import { useCallback, useEffect, useReducer, useRef, useState } from "react"
import BtnCopy from "@/components/btn/copy"
// import BtnFormat from "@/components/btn/format"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { isPureRegexMatching } from "@/lib/safe-regexp"
import { addToSearchHistory } from "@/lib/search-history"
import { cn, useDebouncedFn } from "@/lib/utils"
import { CaseSensitive, ClearIcon, Down, Regexp, SearchIcon, Up, WholeWorld } from "./icons"
import PinnedList from "./PinnedList"
import PopupManager from "./popup-manager"
import { useDragConstraints } from "./use-drag-constraints"

// detect OS
const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0

export type FilterAction =
	| { type: "TOGGLE_CASE_SENSITIVE" }
	| { type: "TOGGLE_WHOLE_WORD" }
	| { type: "TOGGLE_REGEXP" }
	| { type: "SET_SEARCH_TEXT"; payload: string }
	| { type: "SET_INITIAL_STATE"; payload: SearchItem }
	| { type: "RESET_FILTERS" }

const filterReducer = (state: SearchItem, action: FilterAction): SearchItem => {
	switch (action.type) {
		case "TOGGLE_CASE_SENSITIVE":
			return { ...state, isCaseSensitive: !state.isCaseSensitive }
		case "TOGGLE_WHOLE_WORD":
			return { ...state, isWholeWord: !state.isWholeWord }
		case "TOGGLE_REGEXP":
			return { ...state, isRegexp: !state.isRegexp }
		case "SET_SEARCH_TEXT":
			return { ...state, keyword: action.payload }

		case "SET_INITIAL_STATE":
			return { ...state, ...action.payload }
		case "RESET_FILTERS":
			return {
				isCaseSensitive: false,
				isWholeWord: false,
				isRegexp: false,
				keyword: ""
			}
		default:
			return state
	}
}

/**
 * Main component for the extension.
 */
const Popup = ({ selectedText }: { selectedText: string | undefined }) => {
	const popRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	const dragControls = useDragControls()
	const { dragConstraints } = useDragConstraints(popRef)

	/** core state */
	const [state, dispatch] = useReducer(filterReducer, {
		isCaseSensitive: false,
		isWholeWord: false,
		isRegexp: false,
		keyword: selectedText || ""
	})
	useEffect(() => {
		if (selectedText) {
			dispatch({ type: "SET_SEARCH_TEXT", payload: selectedText })
		} else {
			// Restore initial state from storage
			chrome.storage.local.get(
				["keyword", "isCaseSensitive", "isWholeWord", "isRegexp"],
				(result: {
					keyword: string
					isCaseSensitive: boolean
					isWholeWord: boolean
					isRegexp: boolean
				}) => {
					dispatch({ type: "SET_INITIAL_STATE", payload: result })
				}
			)
		}
	}, [])

	/** core actions */
	const performSearch = useCallback(() => {
		console.log("📦 emit search--->", state)
		chrome.runtime.sendMessage(
			{
				action: "__af_search",
				state
			},
			(response: { found: number }) => {
				console.log("📦 get back result--->", response.found)
				chrome.storage.local.set({ ...state })
				!response?.found ? resetStatistics() : setStatistics(response.found)
			}
		)
	}, [state.keyword, state.isCaseSensitive, state.isWholeWord, state.isRegexp])
	const { run, cancel } = useDebouncedFn(performSearch, state.isRegexp ? 500 : 200) // ? maybe better
	useEffect(() => {
		run()
		return () => cancel()
	}, [performSearch])

	const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newKeyword = e.target.value
		dispatch({ type: "SET_SEARCH_TEXT", payload: newKeyword })
	}
	const onInputClear = () => {
		dispatch({ type: "SET_SEARCH_TEXT", payload: "" })
		inputRef.current?.focus()
	}
	/** focus input when popup visible */
	useEffect(() => {
		const timer = setTimeout(() => {
			if (inputRef.current) {
				inputRef.current.select()
			}
			clearTimeout(timer)
		}, 100)
		return () => clearTimeout(timer)
	}, [])

	/** statistics */
	const [total, setTotal] = useState<number>(0)
	const [current, setCurrent] = useState<number>(0)
	const [matchedTexts, setMatchedTexts] = useState<string[]>([]) // used in regex mode, for display and copy
	const resetStatistics = () => {
		setTotal(0)
		setCurrent(0)
		setMatchedTexts([])
		chrome.runtime.sendMessage({ action: "__af_remove_highlights" })
		chrome.storage.session.set({ matchedTexts: [] })
	}
	const setStatistics = (total: number) => {
		setTotal(total)
		setCurrent(1)
		chrome.storage.session.get(["matchedTexts"], (result: { matchedTexts: string[] }) => {
			if (result.matchedTexts) {
				setMatchedTexts(result.matchedTexts)
			}
		})
	}

	/** navigator */
	const setNextIndex = (response: { nextIndex: number }) => {
		if (response) setCurrent(response.nextIndex)
	}
	const goPrev = () => {
		if (total === 0) return
		chrome.runtime.sendMessage({ action: "__af_go_prev", currentIndex: current }, setNextIndex)
	}
	const goNext = () => {
		if (total === 0) return
		chrome.runtime.sendMessage({ action: "__af_go_next", currentIndex: current }, setNextIndex)
	}
	const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
		const isTargetModifier = isMac ? e.ctrlKey && !e.shiftKey : e.ctrlKey && e.shiftKey
		const isActionKey = ["c", "w", "r"].includes(e.key.toLowerCase())
		if (isTargetModifier && isActionKey) return
		e.stopPropagation()
		if (e.key === "Enter") {
			if (e.shiftKey) {
				goPrev()
			} else {
				goNext()
			}
			// add to history
			if (state.keyword.trim()) {
				addToSearchHistory(state)
			}
		}
		if (e.key === "Escape") {
			// actually only hide
			new PopupManager().toggle()
		}
	}

	return (
		<>
			<motion.div
				ref={popRef}
				drag
				dragConstraints={dragConstraints}
				dragListener={false}
				dragControls={dragControls}
				initial={{ opacity: 0, scale: 0 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{
					duration: 0.3,
					scale: { type: "spring", visualDuration: 0.2, bounce: 0.5 }
				}}
				data-awesome-find-popup="true"
				className="fixed top-[16px] right-[16px] "
			>
				<div
					className="p-[10px] text-[#1C1D1F] text-left border border-[rgba(211,211,211,.47)] !bg-[rgba(255,255,255,0.8)] backdrop-blur-[4px] shadow-lg rounded-[14px]"
					onPointerDown={(e) => dragControls.start(e)}
				>
					<p className="h-[20px] text-[12px] mb-[4px] flex items-center justify-between select-none">
						<span className="inline-block min-w-[30px]">
							<span className="text-[#0788dc]">{current}</span>/
							<span className="text-[#6C6E73]">{total}</span>
						</span>
						<div className="flex-1 flex">{<PinnedList dispatch={dispatch} />}</div>
					</p>
					<div>
						<Input
							ref={inputRef}
							placeholder="查找文本"
							value={state.keyword}
							onChange={onInputChange}
							onKeyDown={handleEnter}
							onPointerDown={(e) => e.stopPropagation()}
						>
							<SearchIcon dispatch={dispatch} />
							{state.keyword ? <ClearIcon onClick={onInputClear} /> : null}
							<ToolBar state={state} dispatch={dispatch} goPrev={goPrev} goNext={goNext} />
						</Input>
					</div>
				</div>
				{/* Matched texts display area for regex mode */}
				{state.isRegexp && isPureRegexMatching(state.keyword) && matchedTexts.length > 0 && (
					<RegexpPannel current={current} setCurrent={setCurrent} matchedTexts={matchedTexts} />
				)}
			</motion.div>
		</>
	)
}

function ToolBar({
	state,
	dispatch,
	goPrev,
	goNext
}: {
	state: SearchItem
	dispatch: React.Dispatch<FilterAction>
	goPrev: () => void
	goNext: () => void
}) {
	// add to history while toggle filter
	const addToHistory = useCallback(
		(key: Exclude<keyof SearchItem, "keyword">) => {
			if (state.keyword.trim()) {
				addToSearchHistory({ ...state, [key]: !state[key] })
			}
		},
		[state]
	)
	// add keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Mac: ctrl+key, Ohter: ctrl+shift+key
			const isTargetModifier = isMac ? e.ctrlKey && !e.shiftKey : e.ctrlKey && e.shiftKey

			if (isTargetModifier && !e.altKey && !e.metaKey) {
				switch (e.key.toLowerCase()) {
					case "c":
						e.preventDefault()
						addToHistory("isCaseSensitive")
						dispatch({ type: "TOGGLE_CASE_SENSITIVE" })
						break
					case "w":
						e.preventDefault()
						addToHistory("isWholeWord")
						dispatch({ type: "TOGGLE_WHOLE_WORD" })
						break
					case "r":
						e.preventDefault()
						addToHistory("isRegexp")
						dispatch({ type: "TOGGLE_REGEXP" })
						break
				}
			}
		}

		document.addEventListener("keydown", handleKeyDown)
		return () => document.removeEventListener("keydown", handleKeyDown)
	}, [addToHistory])

	// stop propagation and prevent focus
	const handleButtonClick = (callback: () => void) => (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		callback()
	}
	const stopEnterOnKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault()
			e.stopPropagation()
		}
	}

	const commonClasses =
		"w-[20px] h-[20px] flex items-center justify-center text-[12px] text-[#1C1D1F] hover:text-[#000] cursor-pointer focus:outline-none select-none"
	const activeClasses =
		"!text-[#0788dc] font-bold !bg-[#F3F8FB] rounded-[4px] transition-colors duration-200"

	return (
		<div className="flex absolute right-[6px] top-1/2 -translate-y-1/2 p-[2px] bg-white rounded-[8px] space-x-[4px]">
			<div className={commonClasses} onClick={handleButtonClick(goPrev)} tabIndex={-1}>
				<Up className={cn("w-[14px]")} />
			</div>
			<div className={commonClasses} onClick={handleButtonClick(goNext)} tabIndex={-1}>
				<Down className={cn("w-[14px]")} />
			</div>
			<div className="flex items-center justify-center">
				<div className="w-[1px] h-[14px] mx-[4px] bg-[#dfdfdf]" />
			</div>
			<CaseSensitive
				className={cn(commonClasses, state.isCaseSensitive && activeClasses)}
				onClick={handleButtonClick(() => {
					addToHistory("isCaseSensitive")
					dispatch({ type: "TOGGLE_CASE_SENSITIVE" })
				})}
				tabIndex={-1}
				onKeyDown={stopEnterOnKeyDown}
				title={`大小写敏感 (${isMac ? "Ctrl+C" : "Ctrl+Shift+C"})`}
			/>
			<WholeWorld
				className={cn(commonClasses, state.isWholeWord && activeClasses)}
				onClick={handleButtonClick(() => {
					addToHistory("isWholeWord")
					dispatch({ type: "TOGGLE_WHOLE_WORD" })
				})}
				tabIndex={-1}
				onKeyDown={stopEnterOnKeyDown}
				title={`整词匹配 (${isMac ? "Ctrl+W" : "Ctrl+Shift+W"})`}
			/>
			{/* TODO preset useful common regexp */}
			<Regexp
				className={cn(commonClasses, state.isRegexp && activeClasses)}
				onClick={handleButtonClick(() => {
					addToHistory("isRegexp")
					dispatch({ type: "TOGGLE_REGEXP" })
				})}
				tabIndex={-1}
				onKeyDown={stopEnterOnKeyDown}
				title={`正则表达式 (${isMac ? "Ctrl+R" : "Ctrl+Shift+R"})`}
			/>
		</div>
	)
}

function RegexpPannel({
	current,
	setCurrent,
	matchedTexts
}: {
	current: number
	setCurrent: React.Dispatch<React.SetStateAction<number>>
	matchedTexts: string[]
}) {
	const copySingleMatchedText = (text: string) => {
		if (navigator.clipboard) {
			navigator.clipboard.writeText(text)
		} else {
			const textarea = document.createElement("textarea")
			textarea.value = text
			textarea.style.position = "absolute"
			textarea.style.left = "-9999px"
			document.body.appendChild(textarea)

			textarea.select()
			document.execCommand("copy")
			document.body.removeChild(textarea)
		}
	}
	const copyAllMatchedTexts = () => {
		if (matchedTexts.length === 0) return
		if (navigator.clipboard) {
			const textToCopy = matchedTexts.join("\n")
			navigator.clipboard.writeText(textToCopy)
		} else {
			const textarea = document.createElement("textarea")
			textarea.value = matchedTexts.join("\n")
			textarea.style.position = "absolute"
			textarea.style.left = "-9999px"
			document.body.appendChild(textarea)

			textarea.select()
			document.execCommand("copy")
			document.body.removeChild(textarea)
		}
	}
	const navigateToIndex = (index: number) => {
		chrome.runtime.sendMessage({ action: "__af_go_next", currentIndex: index }, (response) => {
			if (response) setCurrent(response.nextIndex)
		})
	}

	const [index, setIndex] = useState(1)
	const scrollAreaRef = useRef<HTMLDivElement | null>(null)
	useEffect(() => {
		if (!scrollAreaRef.current) return
		if (current > index) {
			scrollAreaRef.current.scrollTo({
				top: (current - 1) * 22,
				behavior: "smooth"
			})
			setIndex(current)
		} else if (current < index) {
			scrollAreaRef.current.scrollTo({
				top: (current - 1) * 22 - 22,
				behavior: "smooth"
			})
			setIndex(current)
		}
	}, [current, scrollAreaRef.current])
	return (
		<div className="max-w-[366px] mt-[4px] relative">
			<div className="relative text-[#1C1D1F] text-left border border-[rgba(211,211,211,.47)] !bg-[rgba(255,255,255,0.8)] backdrop-blur-[4px] shadow-lg rounded-[14px] overflow-hidden">
				<ScrollArea
					ref={scrollAreaRef}
					className="w-full min-h-[120px] max-h-[200px] p-[12px] text-[12px] font-mono text-gray-800 resize-none overflow-y-auto whitespace-pre-line"
				>
					{matchedTexts.map((text, index) => (
						<p
							key={index}
							className="mb-[8px] leading-[14px] last:mb-0 break-words hover:bg-gray-100"
							style={
								index === current - 1
									? {
											backgroundColor: "orange",
											color: "#000",
											padding: "1px 2px",
											borderRadius: "2px",
											fontWeight: "bold",
											boxShadow: "0 0 3px rgba(255, 165, 0, 0.8)"
										}
									: {}
							}
							onClick={(e) => {
								e.stopPropagation()
								copySingleMatchedText(text)
								navigateToIndex(index)
							}}
						>
							{text}
						</p>
					))}
				</ScrollArea>
				{/* ? filter repeat text*/}
				<BtnCopy
					className="absolute top-[4px] right-[8px] p-[2px] hover:bg-gray-200 rounded transition-colors bg-white shadow-sm"
					onCopy={copyAllMatchedTexts}
				/>
				{/* TODO format regex matched text */}
				{/* <BtnFormat
					className="absolute top-[36px] right-[8px] p-[2px] hover:bg-gray-200 rounded transition-colors bg-white shadow-sm"
					onFormat={() => {}}
				/> */}
			</div>
		</div>
	)
}

export default Popup
