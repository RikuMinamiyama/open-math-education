import { Link } from "react-router-dom";
import { useFetch, type Unit } from "../api";
import { LearningProgressSection } from "../components/LearningProgress";
import { useSession } from "../auth-client";

const SUBJECT_ORDER = ["数I", "数A", "数II", "数B", "数III", "数C"] as const;
const COMING_SOON_SUBJECTS = new Set<string>(["数II", "数B", "数III", "数C"]);

function UnitCard({ unit }: { unit: Unit }) {
	return (
		<Link
			to={`/units/${unit.slug}`}
			className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-brand-400 hover:shadow"
		>
			<div className="font-semibold">{unit.name}</div>
			<div className="mt-1 text-xs text-stone-500">{unit.problemCount}問</div>
		</Link>
	);
}

function ComingSoonCard() {
	return (
		<div
			aria-disabled="true"
			className="rounded-xl border border-dashed border-stone-200 bg-stone-50 p-4 text-stone-400"
		>
			<div className="text-sm font-medium text-stone-500">準備中</div>
			<div className="mt-1 text-xs">公開をお待ちください</div>
		</div>
	);
}

export function UnitsPage() {
	const { data: session } = useSession();
	const { data, error, loading } = useFetch<{ units: Unit[] }>("/api/units");

	if (loading) return <p className="text-stone-500">読み込み中...</p>;
	if (error) return <p className="text-rose-600">{error}</p>;

	const unitsBySubject = new Map<string, Unit[]>();
	for (const unit of data?.units ?? []) {
		const key = unit.subject ?? "その他";
		unitsBySubject.set(key, [...(unitsBySubject.get(key) ?? []), unit]);
	}

	const subjects = [
		...SUBJECT_ORDER.filter((s) => unitsBySubject.has(s) || COMING_SOON_SUBJECTS.has(s)),
		...[...unitsBySubject.keys()].filter((s) => !SUBJECT_ORDER.includes(s as (typeof SUBJECT_ORDER)[number])),
	];

	return (
		<div className="space-y-10">
			<h1 className="text-xl font-bold">単元一覧</h1>
			<div className="space-y-8">
				{subjects.map((subject) => {
					const units = unitsBySubject.get(subject) ?? [];
					const comingSoon = COMING_SOON_SUBJECTS.has(subject);

					return (
						<section key={subject}>
							<h2 className="mb-3 text-sm font-bold text-stone-500">{subject}</h2>
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
								{units.map((unit) => (
									<UnitCard key={unit.slug} unit={unit} />
								))}
								{comingSoon && units.length === 0 && <ComingSoonCard />}
							</div>
						</section>
					);
				})}
			</div>
			{session?.user && <LearningProgressSection />}
		</div>
	);
}
