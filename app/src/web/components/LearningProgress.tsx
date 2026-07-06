import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { Link } from "react-router-dom";
import { useFetch, type ProgressMarkResult, type ProgressUnit } from "../api";
import { SectionHeading } from "./SectionHeading";

const SELF_CHECK_STYLES: Record<ProgressMarkResult, { symbol: string; label: string; className: string }> = {
	correct: { symbol: "○", label: "できた", className: "bg-emerald-50 text-emerald-600 ring-emerald-300" },
	partial: { symbol: "△", label: "おしい", className: "bg-amber-50 text-amber-600 ring-amber-300" },
	wrong: { symbol: "×", label: "できなかった", className: "bg-rose-50 text-rose-600 ring-rose-300" },
};

function SelfCheckBadge({ result }: { result: ProgressMarkResult }) {
	const style = SELF_CHECK_STYLES[result];
	return (
		<span
			title={style.label}
			className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1 ${style.className}`}
		>
			{style.symbol}
		</span>
	);
}

export function LearningProgress() {
	const { data, error, loading } = useFetch<{ units: ProgressUnit[] }>("/api/history/progress");

	if (loading) return <p className="text-sm text-stone-500">読み込み中...</p>;
	if (error) return <p className="text-sm text-rose-600">{error}</p>;

	const units = data?.units ?? [];
	if (units.length === 0) {
		return (
			<div className="rounded-xl border border-stone-200 bg-white p-6 text-center text-sm text-stone-500">
				まだ記録がありません。上の単元から問題を解いてみましょう
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{units.map((unit) => (
				<div key={unit.slug}>
					<Link to={`/units/${unit.slug}`} className="text-sm font-semibold text-stone-900 hover:text-brand-700">
						{unit.name}
					</Link>
					<ul className="mt-3 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
						{unit.problems.map((problem, idx) => (
							<li key={problem.slug} className={idx > 0 ? "border-t border-stone-200" : undefined}>
								<Link
									to={`/problems/${problem.slug}`}
									className="flex items-center justify-between gap-x-4 px-4 py-3 transition hover:bg-stone-50"
								>
									<span className="min-w-0 truncate text-sm font-medium text-stone-900">{problem.title}</span>
									<div className="flex shrink-0 items-center gap-2">
										{problem.selfChecks.length > 0 && (
											<div className="flex items-center">
												{problem.selfChecks.map((check, i) => (
													<span key={i} className="flex items-center">
														{i > 0 && <ChevronRightIcon aria-hidden="true" className="size-3 text-stone-300" />}
														<SelfCheckBadge result={check.result} />
													</span>
												))}
											</div>
										)}
										{problem.submissionCount > 0 && (
											<span className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 ring-1 ring-brand-200 ring-inset">
												添削{problem.submissionCount > 1 ? ` ${problem.submissionCount}回` : ""}
											</span>
										)}
									</div>
								</Link>
							</li>
						))}
					</ul>
				</div>
			))}
		</div>
	);
}

export function LearningProgressSection() {
	return (
		<section>
			<SectionHeading title="学習履歴" />
			<div className="pt-5">
				<LearningProgress />
			</div>
		</section>
	);
}
