import type { SubmissionStatus, Verdict } from "../api";

const VERDICT_STYLES: Record<Verdict, { label: string; className: string }> = {
	correct: { label: "正解", className: "bg-emerald-100 text-emerald-800" },
	partially_correct: { label: "おしい", className: "bg-amber-100 text-amber-800" },
	incorrect: { label: "誤りあり", className: "bg-rose-100 text-rose-800" },
	cannot_judge: { label: "判定保留", className: "bg-stone-200 text-stone-700" },
	unreadable: { label: "読み取り不可", className: "bg-stone-200 text-stone-700" },
};

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
	const style = VERDICT_STYLES[verdict];
	return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.className}`}>{style.label}</span>;
}

const STATUS_LABELS: Record<SubmissionStatus, string> = {
	uploaded: "受付済み",
	queued: "順番待ち",
	grading: "添削中",
	graded: "添削済み",
	failed: "添削に失敗しました",
};

export function StatusBadge({ status }: { status: SubmissionStatus }) {
	const pending = status === "uploaded" || status === "queued" || status === "grading";
	return (
		<span
			className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
				status === "failed" ? "bg-rose-100 text-rose-800" : pending ? "bg-sky-100 text-sky-800" : "bg-emerald-100 text-emerald-800"
			}`}
		>
			{pending && <span className="size-2 animate-pulse rounded-full bg-sky-500" />}
			{STATUS_LABELS[status]}
		</span>
	);
}

export function DifficultyStars({ level }: { level: number }) {
	return (
		<span className="text-amber-500 text-sm" title={`難易度 ${level}/10`}>
			{"★".repeat(Math.min(level, 10))}
		</span>
	);
}
