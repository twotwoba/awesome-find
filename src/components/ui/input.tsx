import { motion, useMotionTemplate, useMotionValue } from "motion/react"
import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, children, ref, ...props }: React.ComponentProps<"input">) {
	const [visible, setVisible] = React.useState(false)

	const mouseX = useMotionValue(0)
	const mouseY = useMotionValue(0)

	const handleMouseMove = ({
		currentTarget,
		clientX,
		clientY
	}: React.MouseEvent<HTMLDivElement>) => {
		const { left, top } = currentTarget.getBoundingClientRect()

		mouseX.set(clientX - left)
		mouseY.set(clientY - top)
	}

	return (
		<motion.div
			style={{
				background: useMotionTemplate`radial-gradient(${visible ? "100px" : "0px"} circle at ${mouseX}px ${mouseY}px, #3b82f6, transparent 60%)`
			}}
			onMouseMove={handleMouseMove}
			onMouseEnter={() => setVisible(true)}
			onMouseLeave={() => setVisible(false)}
			className="relative p-[2px] rounded-[8px] transition duration-300 group/input"
		>
			{/* TODO  input border color: put into setting*/}
			<input
				type={type}
				className={cn(
					`flex h-[32px] min-w-[340px] w-full border-none bg-[#f1f1f1] dark:bg-zinc-800 text-black dark:text-white rounded-[6px] py-[4px] pl-[32px] pr-[156px] text-[12px]
        		     placeholder:text-neutral-400 dark:placeholder-text-neutral-600
        			 focus-visible:outline-none focus-visible:outline-1 focus-visible:ring-[2px]  focus-visible:ring-[#e5e5e5]
         			 disabled:cursor-not-allowed disabled:opacity-50
         			 group-hover/input:shadow-none transition duration-400
					 selection:bg-black selection:text-white`,
					className
				)}
				ref={ref}
				{...props}
			/>
			{children}
		</motion.div>
	)
}

export { Input }
