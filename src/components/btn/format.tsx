import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Format } from "@/core/popup/icons"
import { cn } from "@/lib/utils"

const BtnFormat = ({
	onFormat,
	className,
	...props
}: {
	onFormat: () => void
	className?: string
}) => {
	const [formatted, setFormatted] = useState<boolean>(false)

	const handleSwitchFormat = async () => {
		setFormatted(!formatted)
		if (!formatted) {
			onFormat()
		}
	}

	return (
		<Button
			size="icon"
			onClick={handleSwitchFormat}
			className={cn(className, formatted ? "bg-gray-300" : "")}
			{...props}
		>
			<div
				className={cn("transition-all", formatted ? "scale-100 opacity-100" : "scale-0 opacity-0")}
			>
				<Format className="stroke-emerald-500" size={16} strokeWidth={2} aria-hidden="true" />
			</div>
			<div
				className={cn(
					"absolute transition-all",
					formatted ? "scale-0 opacity-0" : "scale-100 opacity-100"
				)}
			>
				<Format size={16} strokeWidth={2} aria-hidden="true" />
			</div>
		</Button>
	)
}

export default BtnFormat
