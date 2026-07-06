import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useFetch, type ProblemSummary, type ProgressMarkResult, type UnitGroup } from "../api";
import { BreadcrumbSeparator } from "../components/Breadcrumb";
import { DifficultyStars } from "../components/badges";

interface UnitResponse {
	unit: { slug: string; name: string; subject: string | null };
	groups: UnitGroup[];
}

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

function ProblemTable({ problems }: { problems: ProblemSummary[] }) {
	const navigate = useNavigate();

	return (
		<div className="overflow-x-auto">
			<table className="min-w-full divide-y divide-stone-200">
				<thead>
					<tr>
						<th scope="col" className="py-3 pr-3 pl-4 text-left text-sm font-semibold text-stone-900 sm:pl-0">
							問題
						</th>
						<th scope="col" className="px-3 py-3 text-left text-sm font-semibold text-stone-900">
							記録
						</th>
						<th scope="col" className="px-3 py-3 text-left text-sm font-semibold text-stone-900">
							添削
						</th>
						<th scope="col" className="py-3 pr-4 pl-3 text-right text-sm font-semibold text-stone-900 sm:pr-0">
							難易度
						</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-stone-200">
					{problems.map((problem) => (
						<tr
							key={problem.slug}
							onClick={() => navigate(`/problems/${problem.slug}`)}
							className="cursor-pointer transition hover:bg-stone-50"
						>
							<td className="py-4 pr-3 pl-4 text-sm font-medium whitespace-nowrap text-stone-900 sm:pl-0">
								{problem.title}
							</td>
							<td className="px-3 py-4 text-sm text-stone-500">
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
							</td>
							<td className="px-3 py-4 text-sm whitespace-nowrap text-stone-500">
								{problem.submissionCount > 0 ? (
									<span className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-brand-200 ring-inset">
										{problem.submissionCount > 1 ? `${problem.submissionCount}回` : "あり"}
									</span>
								) : (
									<span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-500 ring-1 ring-stone-200 ring-inset">
										なし
									</span>
								)}
							</td>
							<td className="py-4 pr-4 pl-3 text-right whitespace-nowrap sm:pr-0">
								<DifficultyStars level={problem.difficulty} />
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export function UnitPage() {
	const { slug } = useParams();
	const { data, error, loading } = useFetch<UnitResponse>(slug ? `/api/units/${slug}` : null);

	if (loading) return <p className="text-stone-500">読み込み中...</p>;
	if (error) return <p className="text-rose-600">{error}</p>;
	if (!data) return null;

	return (
		<div className="space-y-8">
			<nav className="flex flex-wrap items-center gap-x-1 text-sm text-stone-500">
				<Link to="/" className="hover:underline">
					単元一覧
				</Link>
				<BreadcrumbSeparator />
				<span>{data.unit.name}</span>
			</nav>
			<h1 className="text-xl font-bold">{data.unit.name}</h1>
			{data.groups.length === 0 ? (
				<p className="text-stone-500">この単元の問題は準備中です</p>
			) : (
				data.groups.map((group, i) => (
					<section key={group.topic?.slug ?? `direct-${i}`}>
						{group.topic && (
							<h2 className="mb-3 border-l-4 border-brand-600 pl-2 text-sm font-bold text-stone-600">{group.topic.name}</h2>
						)}
						<ProblemTable problems={group.problems} />
					</section>
				))
			)}
		</div>
	);
}
