import { Link, useParams } from "react-router-dom";
import { useFetch, type ProblemSummary, type UnitGroup } from "../api";
import { DifficultyStars } from "../components/badges";

interface UnitResponse {
	unit: { slug: string; name: string; subject: string | null };
	groups: UnitGroup[];
}

function ProblemList({ problems }: { problems: ProblemSummary[] }) {
	return (
		<ul className="space-y-2">
			{problems.map((problem) => (
				<li key={problem.slug}>
					<Link
						to={`/problems/${problem.slug}`}
						className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-teal-400 hover:shadow"
					>
						<span className="font-medium">{problem.title}</span>
						<DifficultyStars level={problem.difficulty} />
					</Link>
				</li>
			))}
		</ul>
	);
}

export function UnitPage() {
	const { slug } = useParams();
	const { data, error, loading } = useFetch<UnitResponse>(slug ? `/api/units/${slug}` : null);

	if (loading) return <p className="text-stone-500">読み込み中...</p>;
	if (error) return <p className="text-rose-600">{error}</p>;
	if (!data) return null;

	return (
		<div className="space-y-6">
			<nav className="text-sm text-stone-500">
				<Link to="/" className="hover:underline">
					単元一覧
				</Link>
				<span className="mx-1">/</span>
				<span>{data.unit.name}</span>
			</nav>
			<h1 className="text-xl font-bold">
				{data.unit.name}
				{data.unit.subject && <span className="ml-2 text-sm font-normal text-stone-500">{data.unit.subject}</span>}
			</h1>
			{data.groups.length === 0 ? (
				<p className="text-stone-500">この単元の問題は準備中です</p>
			) : (
				data.groups.map((group, i) => (
					<section key={group.topic?.slug ?? `direct-${i}`}>
						{group.topic && (
							<h2 className="mb-3 border-l-4 border-teal-600 pl-2 text-sm font-bold text-stone-600">{group.topic.name}</h2>
						)}
						<ProblemList problems={group.problems} />
					</section>
				))
			)}
		</div>
	);
}
