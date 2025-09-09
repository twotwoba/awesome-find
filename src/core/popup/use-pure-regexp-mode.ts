import { useEffect, useState } from "react"

/**
 * ! [deprecated]
 */
export const useIsPureRegexpMode = (keyword: string, isRegexp: boolean) => {
	// special characters in regex that indicate it's not a plain text search
	const regexMetacharacters = /[\\^$.*+?()[\]{}|]/

	function isValidRegExpPattern(pattern: string): boolean {
		try {
			new RegExp(pattern)
			return true
		} catch (_e) {
			return false
		}
	}

	/**
	 * Check if brackets and braces are properly balanced
	 */
	function hasBalancedBrackets(pattern: string): boolean {
		const brackets = { "(": ")", "[": "]", "{": "}" }
		const stack: string[] = []
		let isEscaped = false

		for (let i = 0; i < pattern.length; i++) {
			const char = pattern[i]

			if (isEscaped) {
				isEscaped = false
				continue
			}

			if (char === "\\") {
				isEscaped = true
				continue
			}

			if (Object.keys(brackets).includes(char)) {
				stack.push(char)
			} else if (Object.values(brackets).includes(char)) {
				const lastOpen = stack.pop()
				if (!lastOpen || brackets[lastOpen as keyof typeof brackets] !== char) {
					return false
				}
			}
		}

		return stack.length === 0
	}

	/**
	 * Check if the pattern is a meaningful regex pattern
	 * A meaningful regex should:
	 * 1. Be a valid regex pattern
	 * 2. Contain regex metacharacters
	 * 3. Have properly balanced brackets/braces
	 */
	function isPureRegexMatching(pattern: string): boolean {
		if (!isValidRegExpPattern(pattern)) {
			return false
		}

		// Must contain regex metacharacters
		if (!regexMetacharacters.test(pattern)) {
			return false
		}

		// Check for balanced brackets and braces
		if (!hasBalancedBrackets(pattern)) {
			return false
		}

		return true
	}

	/**
	 * * not a good way to use state control outside function execution time.
	 * * better to use export isPureRegexMatching to control the outside function execution.
	 */
	const [isPureRegexp, setIsPureRegexp] = useState(false)
	useEffect(() => {
		if (!isRegexp || !keyword?.trim()) {
			setIsPureRegexp(false)
		} else {
			setIsPureRegexp(isPureRegexMatching(keyword))
		}
	}, [keyword, isRegexp])

	return { isPureRegexp, isPureRegexMatching }
}
