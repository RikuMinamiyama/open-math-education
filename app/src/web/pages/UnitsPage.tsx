import { Link } from "react-router-dom";
import { useFetch, type Unit } from "../api";

export function UnitsPage() {
	const { data, error, loading } = useFetch<{ units: Unit[] }>("/api/units");

	if (loading) return <p className="text-stone-500">読み込み中...</p>;
	if (error) return <p className="text-rose-600">{error}</p>;

	const subjects = new Map<string, Unit[]>();
	for (const unit of data?.units ?? []) {
		const key = unit.subject ?? "その他";
		subjects.set(key, [...(subjects.get(key) ?? []), unit]);
	}

	return (
		<div className="space-y-8">
			<section className="rounded-2xl bg-brand-500 px-6 py-8 text-brand-900">
				<h1 className="text-xl font-bold">単元を選んで演習をはじめよう</h1>
				<p className="mt-2 text-sm text-brand-800">
					問題を解いたらノートを撮影してアップロード。AIがあなたの答案を添削します
				</p>
			</section>
			{[...subjects.entries()].map(([subject, units]) => (
				<section key={subject}>
					<h2 className="mb-3 text-sm font-bold text-stone-500">{subject}</h2>
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						{units.map((unit) => (
							<Link
								key={unit.slug}
								to={`/units/${unit.slug}`}
								className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-brand-400 hover:shadow"
							>
								<div className="font-semibold">{unit.name}</div>
								<div className="mt-1 text-xs text-stone-500">{unit.problemCount}問</div>
							</Link>
						))}
					</div>
				</section>
			))}
		</div>
	);
}
