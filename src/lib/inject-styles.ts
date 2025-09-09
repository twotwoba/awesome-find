/**
 * Inject Tailwind CSS styles into Shadow DOM
 */
import tailwindCss from "../assets/css/output.css?inline"

export const injectTailwindStyles = (shadowRoot: ShadowRoot): void => {
	const style = document.createElement("style")

	/**
	 * supplement tailwindcss with Shadow DOM compatibility
	 * This ensures that CSS variables and other styles work correctly within the Shadow DOM.
	 *
	 * ! Remember that: shadow DOM encapsulates styles, but not includes css unit computed, like `rem`.
	 */
	const shadowDomCompatibilityCSS = `
		/* Ensure CSS variables work in Shadow DOM */
		:host {
			--text-base: 16px;
			--tw-border-style: solid;
			--tw-gradient-position: initial;
			--tw-gradient-from: transparent;
			--tw-gradient-via: transparent;
			--tw-gradient-to: transparent;
			--tw-gradient-stops: initial;
			--tw-gradient-via-stops: initial;
			--tw-gradient-from-position: 0%;
			--tw-gradient-via-position: 50%;
			--tw-gradient-to-position: 100%;
			--tw-font-weight: initial;
			--tw-shadow: 0 0 transparent;
			--tw-shadow-color: initial;
			--tw-shadow-alpha: 100%;
			--tw-inset-shadow: 0 0 transparent;
			--tw-inset-shadow-color: initial;
			--tw-inset-shadow-alpha: 100%;
			--tw-ring-color: initial;
			--tw-ring-shadow: 0 0 transparent;
			--tw-inset-ring-color: initial;
			--tw-inset-ring-shadow: 0 0 transparent;
			--tw-ring-inset: initial;
			--tw-ring-offset-width: 0px;
			--tw-ring-offset-color: #fff;
			--tw-ring-offset-shadow: 0 0 transparent;
			--tw-outline-style: solid;
			--tw-translate-x: 0;
			--tw-translate-y: 0;
			--tw-scale-y: 1;
		}
	`

	// biome-ignore lint/style/useTemplate: <it's ok>
	style.textContent = shadowDomCompatibilityCSS + "\n" + tailwindCss
	shadowRoot.appendChild(style)
}
