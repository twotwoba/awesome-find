import { type ClassValue, clsx } from "clsx"
import { useCallback, useRef } from "react"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function useDebouncedFn<T extends (...args: any[]) => any>(func: T, delay: number = 500) {
	const timerRef = useRef<number | null>(null)

	const debouncedFunction = useCallback(
		(...args: Parameters<T>) => {
			if (timerRef.current) {
				clearTimeout(timerRef.current)
			}

			timerRef.current = setTimeout(() => {
				func(...args)
			}, delay)
		},
		[func, delay]
	)

	const cancelDebounce = useCallback(() => {
		if (timerRef.current) {
			clearTimeout(timerRef.current)
			timerRef.current = null
		}
	}, [])

	return { run: debouncedFunction, cancel: cancelDebounce }
}
