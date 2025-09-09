import type React from "react"
import { type ReactNode, useEffect, useRef } from "react"
import { createRoot, type Root } from "react-dom/client"
import { injectTailwindStyles } from "@/lib/inject-styles"

interface ShadowDomProps {
	children: ReactNode
	mode?: "open" | "closed"
	className?: string
	style?: React.CSSProperties
	delegatesFocus?: boolean
}

/**
 * Custom Shadow DOM component
 * This component creates a shadow root and renders children into it.
 */
const ShadowDom: React.FC<ShadowDomProps> = ({
	children,
	mode = "closed",
	className,
	style,
	delegatesFocus = false
}) => {
	const hostRef = useRef<HTMLDivElement>(null)
	const shadowRootRef = useRef<ShadowRoot | null>(null)
	const containerRef = useRef<HTMLDivElement | null>(null)
	const rootRef = useRef<Root | null>(null)

	useEffect(() => {
		if (!hostRef.current) return

		// Create shadow root
		try {
			shadowRootRef.current = hostRef.current.attachShadow({
				mode,
				delegatesFocus
			})

			// Create container for React content
			containerRef.current = document.createElement("div")
			shadowRootRef.current.appendChild(containerRef.current)

			/* Inject Tailwind CSS styles (by @tailwindcss/cli compiles output) */
			injectTailwindStyles(shadowRootRef.current)
		} catch (error) {
			console.error("Failed to create shadow DOM:", error)
		}

		return () => {
			if (containerRef.current && shadowRootRef.current) {
				shadowRootRef.current.removeChild(containerRef.current)
			}
		}
	}, [mode, delegatesFocus])
	useEffect(() => {
		if (containerRef.current && !rootRef.current) {
			rootRef.current = createRoot(containerRef.current)
		}

		if (rootRef.current) {
			rootRef.current.render(<>{children}</>)
		}

		return () => {
			if (rootRef.current) {
				rootRef.current.unmount()
				rootRef.current = null
			}
		}
	}, [children])

	return <div ref={hostRef} className={className} style={style} />
}

export default ShadowDom
