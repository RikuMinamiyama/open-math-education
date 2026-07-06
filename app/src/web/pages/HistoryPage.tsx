import { Link } from "react-router-dom";
import { useFetch, type SubmissionSummary } from "../api";
import { StatusBadge, VerdictBadge } from "../components/badges";

export function HistoryPage() {
	const { data, error, loading } = useFetch<{ submissions: SubmissionSummary[] }>("/api/submissions");

	if (loading) return <p className="text-stone-500">読み込み中...</p>;
	if (error) return <p className="text-rose-600">{error}</p>;

	const submissions = data?.submissions ?? [];

	return (
		<div className="space-y-4">
			<h1 className="text-xl font-bold">学習履歴</h1>
			{submissions.length === 0 ? (
				<div className="rounded-xl border border-stone-200 bg-white p-6 text-center text-sm text-stone-500">
					まだ提出がありません。
					<Link to="/" className="text-brand-700 underline">
						単元一覧
					</Link>
					から問題を解いてみましょう
				</div>
			) : (
				<ul className="space-y-2">
					{submissions.map((s) => (
						<li key={s.id}>
							<Link
								to={`/submissions/${s.id}`}
								className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-brand-400 hover:shadow"
							>
								<div className="min-w-0">
									<div className="truncate font-medium">{s.problemTitle}</div>
									<div className="mt-0.5 text-xs text-stone-500">{new Date(s.createdAt).toLocaleString("ja-JP")}</div>
								</div>
								{s.verdict ? <VerdictBadge verdict={s.verdict} /> : <StatusBadge status={s.status} />}
							</Link>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
