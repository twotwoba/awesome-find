import { useEffect, useRef, useState } from "react"
import { getSearchPin, removeFromSearchPin } from "@/lib/search-pin"
import type { FilterAction } from "."
import { Unpinned } from "./icons"

const PinnedList = ({ dispatch }: { dispatch: React.Dispatch<FilterAction> }) => {
	const [pinnedList, setPinnedList] = useState<SearchItem[]>([])
	const dragStateRef = useRef({ isDragging: false, startX: 0, startY: 0 })

	useEffect(() => {
		getSearchPin().then((res) => setPinnedList(res))
		chrome.storage.onChanged.addListener((changes) => {
			if (Object.keys(changes).includes("__af_search_pin")) {
				getSearchPin().then((res) => setPinnedList(res))
			}
		})
	}, [])

	// avoid click event when dragging
	const handleMouseDown = (e: React.MouseEvent) => {
		dragStateRef.current = {
			isDragging: false,
			startX: e.clientX,
			startY: e.clientY
		}
	}
	const handleMouseMove = (e: React.MouseEvent) => {
		const { startX, startY } = dragStateRef.current
		const deltaX = Math.abs(e.clientX - startX)
		const deltaY = Math.abs(e.clientY - startY)

		if (deltaX > 2 || deltaY > 2) {
			dragStateRef.current.isDragging = true
		}
	}

	return (
		<div className="flex gap-[4px] pl-[4px]">
			{pinnedList?.length > 0
				? pinnedList.map((item) => (
						<div className="relative group" key={item.keyword}>
							<div
								className="max-w-[122px] px-[8px] rounded-[11px] leading-[22px] bg-[#c0e5f8] whitespace-nowrap overflow-hidden text-ellipsis text-[11px] select-none cursor-pointer"
								onMouseDown={handleMouseDown}
								onMouseMove={handleMouseMove}
								onClick={() => {
									if (dragStateRef.current.isDragging) {
										dragStateRef.current.isDragging = false
										return
									}
									dispatch({ type: "SET_INITIAL_STATE", payload: item })
								}}
							>
								{item.keyword}
							</div>
							<Unpinned
								className="absolute -top-[9px] -right-[6px] cursor-pointer opacity-0 group-hover:opacity-90 transition-opacity"
								onMouseDown={handleMouseDown}
								onMouseMove={handleMouseMove}
								onClick={() => {
									if (dragStateRef.current.isDragging) {
										dragStateRef.current.isDragging = false
										return
									}
									removeFromSearchPin(item.keyword)
								}}
							/>
						</div>
					))
				: null}
		</div>
	)
}

export default PinnedList
