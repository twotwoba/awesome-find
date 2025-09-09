/**
 * Utility functions to safely check if a string is a valid and meaningful regex pattern
 */

/**
 * exclude plain text patterns that do not contain any regex metacharacters
 */
const regexMetacharacters = /[\\^$.*+?()[\]{}|]/

/**
 * Check if a string is a valid RegExp pattern
 */
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
 * Uses pattern analysis instead of exhaustive enumeration
 */
function isMeaningfulRegex(pattern: string): boolean {
	// Remove anchors for analysis
	const cleanPattern = pattern.replace(/^\^|\$$/g, "")

	// Check for overly broad patterns that match everything
	if (isOverlyBroadPattern(cleanPattern)) {
		return false
	}

	// Check for patterns that are essentially plain text
	if (isEssentiallyPlainText(cleanPattern)) {
		return false
	}

	// Check for redundant quantifiers
	if (hasRedundantQuantifiers(cleanPattern)) {
		return false
	}

	return true
}

/**
 * Check if pattern matches everything or almost everything
 */
function isOverlyBroadPattern(pattern: string): boolean {
	// Universal character classes that match any character
	const universalPatterns = [
		/^\.[*+?]?$/, // ., .*, .+, .?
		/^\[\\?s\\?S\][*+?]?$/, // [\s\S], [\s\S]*, etc.
		/^\[\\?S\\?s\][*+?]?$/, // [\S\s], [\S\s]*, etc.
		/^\[\\?w\\?W\][*+?]?$/, // [\w\W], [\w\W]*, etc.
		/^\[\\?W\\?w\][*+?]?$/, // [\W\w], [\W\w]*, etc.
		/^\[\\?d\\?D\][*+?]?$/, // [\d\D], [\d\D]*, etc.
		/^\[\\?D\\?d\][*+?]?$/, // [\D\d], [\D\d]*, etc.
		/^\[\\u0000-\\uFFFF\][*+?]?$/, // Unicode range
		/^\[\^\\?r?\\?n\]\*$/ // [^\n]*, [^\r\n]*
	]

	return universalPatterns.some((regex) => regex.test(pattern))
}

/**
 * Check if pattern is essentially plain text with minimal regex features
 */
function isEssentiallyPlainText(pattern: string): boolean {
	// Remove escaped characters for analysis
	const withoutEscapes = pattern.replace(/\\./g, "X")

	// Count meaningful regex constructs
	const meaningfulConstructs = [
		/[[\]]/g, // Character classes
		/[{}]/g, // Quantifiers
		/[()]/g, // Groups
		/[|]/g, // Alternation
		/[+*?]/g // Quantifiers (not following .)
	]

	let constructCount = 0
	for (const construct of meaningfulConstructs) {
		const matches = withoutEscapes.match(construct)
		if (matches) {
			constructCount += matches.length
		}
	}

	// If pattern is too short and has very few constructs, it's likely plain text
	return pattern.length <= 3 && constructCount <= 1
}

/**
 * Check for patterns with redundant or meaningless quantifiers
 */
function hasRedundantQuantifiers(pattern: string): boolean {
	// Patterns like .*?, .+? that are overly greedy/lazy without purpose
	const redundantPatterns = [
		/^\.\*\?$/, // .*?
		/^\.\+\?$/, // .+?
		/^\.\?$/ // .? (too simple)
	]

	return redundantPatterns.some((regex) => regex.test(pattern))
}

/**
 * Check if the pattern is a meaningful regex pattern
 * A meaningful regex should:
 * 1. Be a valid regex pattern
 * 2. Contain regex metacharacters
 * 3. Have properly balanced brackets/braces
 */
export function isPureRegexMatching(pattern: string | undefined): boolean {
	if (!pattern || pattern.trim() === "") {
		return false
	}

	if (!isValidRegExpPattern(pattern)) {
		return false
	}

	if (!regexMetacharacters.test(pattern)) {
		return false
	}

	if (!hasBalancedBrackets(pattern)) {
		return false
	}

	if (!isMeaningfulRegex(pattern)) {
		return false
	}

	return true
}
