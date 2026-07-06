import { ChevronRightIcon } from "@heroicons/react/20/solid";

export function SectionHeading({ title, collapsible }: { title: string; collapsible?: boolean }) {
	return (
		<div className="flex items-center justify-between gap-3 border-b border-stone-200 pb-5">
			<h3 className="text-base font-semibold text-stone-900">{title}</h3>
			{collapsible && (
				<ChevronRightIcon
					aria-hidden="true"
					className="size-5 shrink-0 text-stone-400 transition-transform duration-200 group-open:rotate-90"
				/>
			)}
		</div>
	);
}

