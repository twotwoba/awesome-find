import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, Copy } from "@/core/popup/icons"
import { cn } from "@/lib/utils"

const BtnCopy = ({ onCopy, className, ...props }: { onCopy: () => void; className?: string }) => {
	const [copied, setCopied] = useState<boolean>(false)

	const handleCopy = async () => {
		setCopied(true)
		setTimeout(() => setCopied(false), 1500)
		if (!copied) {
			onCopy()
		}
	}

	return (
		<Button
			size="icon"
			onClick={handleCopy}
			aria-label={copied ? "Copied" : "Copy to clipboard"}
			disabled={copied}
			className={cn("disabled:opacity-100", copied ? "!bg-white" : "", className)}
			{...props}
		>
			<div className={cn("transition-all", copied ? "scale-100 opacity-100" : "scale-0 opacity-0")}>
				<Check className="stroke-emerald-500" size={16} strokeWidth={2} aria-hidden="true" />
			</div>
			<div
				className={cn(
					"absolute transition-all",
					copied ? "scale-0 opacity-0" : "scale-100 opacity-100"
				)}
			>
				<Copy size={16} strokeWidth={2} aria-hidden="true" />
			</div>
		</Button>
	)
}

export default BtnCopy
