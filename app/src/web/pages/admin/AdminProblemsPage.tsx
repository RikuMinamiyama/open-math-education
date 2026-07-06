import { Link } from "react-router-dom";
import { useFetch, type AdminProblemSummary } from "../../api";
import { DifficultyStars } from "../../components/badges";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
	published: { label: "公開中", className: "bg-emerald-100 text-emerald-800" },
	draft: { label: "下書き", className: "bg-stone-200 text-stone-700" },
	archived: { label: "非公開", className: "bg-stone-200 text-stone-500" },
};

export function AdminProblemsPage() {
	const { data, error, loading } = useFetch<{ problems: AdminProblemSummary[] }>("/api/admin/problems");

	if (loading) return <p className="text-stone-500">読み込み中...</p>;
	if (error) return <p className="text-rose-600">{error}</p>;

	const problems = data?.problems ?? [];

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-xl font-bold">問題管理</h1>
				<Link
					to="/admin/problems/new"
					className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
				>
					新しい問題を作る
				</Link>
			</div>
			{problems.length === 0 ? (
				<p className="text-stone-500">まだ問題がありません</p>
			) : (
				<ul className="space-y-2">
					{problems.map((p) => {
						const status = STATUS_LABELS[p.status] ?? STATUS_LABELS.draft;
						return (
							<li key={p.slug}>
								<Link
									to={`/admin/problems/${p.slug}`}
									className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-brand-400 hover:shadow"
								>
									<div className="min-w-0">
										<div className="truncate font-medium">{p.title}</div>
										<div className="mt-0.5 flex items-center gap-2 text-xs text-stone-500">
											<code>{p.slug}</code>
											<DifficultyStars level={p.difficulty} />
										</div>
									</div>
									<span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.className}`}>
										{status.label}
									</span>
								</Link>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
