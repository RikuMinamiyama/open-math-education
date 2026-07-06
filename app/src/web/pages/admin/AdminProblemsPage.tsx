import { Link } from "react-router-dom";
import { useFetch, type Unit } from "../../api";

const SUBJECT_ORDER = ["数I", "数A", "数II", "数B", "数III", "数C"] as const;

function UnitCard({ unit }: { unit: Unit }) {
	return (
		<Link
			to={`/admin/units/${unit.slug}`}
			className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-brand-400 hover:shadow"
		>
			<div className="font-semibold">{unit.name}</div>
			<div className="mt-1 text-xs text-stone-500">{unit.problemCount}問</div>
		</Link>
	);
}

export function AdminProblemsPage() {
	const { data, error, loading } = useFetch<{ units: Unit[] }>("/api/admin/units");

	if (loading) return <p className="text-stone-500">読み込み中...</p>;
	if (error) return <p className="text-rose-600">{error}</p>;

	const unitsBySubject = new Map<string, Unit[]>();
	for (const unit of data?.units ?? []) {
		const key = unit.subject ?? "その他";
		unitsBySubject.set(key, [...(unitsBySubject.get(key) ?? []), unit]);
	}

	const subjects = [
		...SUBJECT_ORDER.filter((s) => unitsBySubject.has(s)),
		...[...unitsBySubject.keys()].filter((s) => !SUBJECT_ORDER.includes(s as (typeof SUBJECT_ORDER)[number])),
	];

	return (
		<div className="space-y-8">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<h1 className="text-xl font-bold">問題管理</h1>
				<div className="flex flex-wrap gap-2">
					<Link
						to="/admin/tags"
						className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 transition hover:bg-stone-50"
					>
						単元・項目を管理
					</Link>
					<Link
						to="/admin/problems/new"
						className="shrink-0 rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
					>
						新しい問題を作る
					</Link>
				</div>
			</div>
			{subjects.length === 0 ? (
				<p className="text-stone-500">まだ単元がありません</p>
			) : (
				subjects.map((subject) => {
					const units = unitsBySubject.get(subject) ?? [];
					return (
						<section key={subject}>
							<h2 className="mb-3 text-sm font-bold text-stone-500">{subject}</h2>
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
								{units.map((unit) => (
									<UnitCard key={unit.slug} unit={unit} />
								))}
							</div>
						</section>
					);
				})
			)}
		</div>
	);
}
