import { type RefObject, useEffect, useState } from "react"

/**
 * useDragConstraints hook
 * This hook calculates the drag constraints for a popup element based on the viewport size
 * and the initial position of the popup.
 */
const useDragConstraints = (ref: RefObject<HTMLDivElement | null>) => {
	const [viewport, setViewport] = useState({
		width: window.innerWidth,
		height: window.innerHeight
	})
	useEffect(() => {
		const handleResize = () => {
			setViewport({
				width: window.innerWidth,
				height: window.innerHeight
			})
		}
		window.addEventListener("resize", handleResize)
		return () => window.removeEventListener("resize", handleResize)
	}, [])

	const [elementSize, setElementSize] = useState<{ width: number; height: number }>()
	const [initialPosition, setInitialPosition] = useState<{ x: number; y: number }>()
	useEffect(() => {
		setTimeout(() => {
			if (ref.current) {
				const rect = ref.current.getBoundingClientRect()
				setElementSize({ width: rect.width, height: rect.height })
				setInitialPosition({ x: rect.left, y: rect.top })
			}
		}, 100)
	}, [ref.current])

	const [dragConstraints, setDragConstraints] = useState<{
		left: number
		right: number
		top: number
		bottom: number
	}>()
	// FIXME: while client size change, the popup position may not be correct
	// caused by --- initialPosition
	// so we need to recalculate the drag constraints
	useEffect(() => {
		/** Cause wrapped by a shadow dom, so we need to adjust the drag constraints */
		const dragConstraints = {
			left: -(initialPosition?.x || 0) + 16,
			right: viewport.width - (elementSize?.width || 0) - (initialPosition?.x || 0) - 16,
			top: 0,
			bottom: viewport.height - (elementSize?.height || 0) - (initialPosition?.y || 0) - 16
		}
		setDragConstraints(dragConstraints)
	}, [initialPosition, elementSize, viewport])

	return {
		dragConstraints
	}
}

export { useDragConstraints }
