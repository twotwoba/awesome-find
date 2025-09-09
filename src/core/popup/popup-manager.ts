/**
 * Control popup visibility and behavior
 */
class PopupManager {
	/*  [!deprecated]
	private selectedText?: string;
	constructor(selectedText?: string) {
		this.selectedText = selectedText;
	}
	// use getter to make sure to always get the latest selectedText
	private get events() {
		return {
			open: new CustomEvent("AF_MOUNT_POPUP", { detail: this.selectedText }),
			close: new CustomEvent("AF_UNMOUNT_POPUP")
		};
	} */
	private createOpenEvent(detail?: string) {
		return new CustomEvent("AF_MOUNT_POPUP", { detail });
	}

	private get closeEvent() {
		return new CustomEvent("AF_UNMOUNT_POPUP");
	}

	private escHandler = (e: KeyboardEvent) => {
		if (e.key === "Escape") {
			this.hide()
		}
	}

	static Id = "__af_popup_container__"

	toggle(selectedText?: string) {
		const container = document.getElementById(PopupManager.Id)
		container ? this.hide() : this.show(selectedText)
	}

	private show(selectedText?: string) {
		document.dispatchEvent(this.createOpenEvent(selectedText))
		document.removeEventListener("keydown", this.escHandler)
		document.addEventListener("keydown", this.escHandler)
	}

	private hide() {
		document.dispatchEvent(this.closeEvent)
		document.removeEventListener("keydown", this.escHandler)

		chrome.runtime.sendMessage({ action: "__af_remove_highlights" })
	}
}
export default PopupManager
