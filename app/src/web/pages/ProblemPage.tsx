import { Link, useParams } from "react-router-dom";
import { useFetch, type Me, type ProblemDetail } from "../api";
import { BreadcrumbSeparator } from "../components/Breadcrumb";
import { DifficultyStars } from "../components/badges";
import { MathText } from "../components/Katex";
import { ProblemFeed } from "../components/ProblemFeed";
import { SectionHeading } from "../components/SectionHeading";

export function ProblemPage() {
	const { slug } = useParams();
	const { data, error, loading } = useFetch<{ problem: ProblemDetail }>(slug ? `/api/problems/${slug}` : null);
	const { data: me, reload: reloadMe } = useFetch<Me>("/api/me");

	if (loading) return <p className="text-stone-500">読み込み中...</p>;
	if (error) return <p className="text-rose-600">{error}</p>;
	if (!data || !slug) return null;

	const problem = data.problem;

	return (
		<div className="space-y-8">
			<nav className="flex flex-wrap items-center gap-x-1 text-sm text-stone-500">
				<Link to="/" className="hover:underline">
					単元一覧
				</Link>
				{problem.tags[0] && (
					<>
						<BreadcrumbSeparator />
						<Link to={`/units/${(problem.tags[0].parent ?? problem.tags[0]).slug}`} className="hover:underline">
							{(problem.tags[0].parent ?? problem.tags[0]).name}
						</Link>
						{problem.tags[0].parent && (
							<>
								<BreadcrumbSeparator />
								<span>{problem.tags[0].name}</span>
							</>
						)}
					</>
				)}
			</nav>

			<div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:items-start lg:gap-10 xl:gap-12">
				<div className="space-y-8">
					<div className="flex items-start justify-between gap-3">
						<h1 className="text-xl font-bold">{problem.title}</h1>
						<DifficultyStars level={problem.difficulty} />
					</div>

					<section>
						<SectionHeading title="問題" />
						<div className="pt-5">
							<MathText text={problem.statementTex} />
							{problem.attribution && <p className="mt-4 text-xs text-stone-400">{problem.attribution}</p>}
						</div>
					</section>

					{problem.answerTex && (
						<details className="group">
							<summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
								<SectionHeading title="解答" collapsible />
							</summary>
							<div className="pt-5">
								<MathText text={problem.answerTex} />
							</div>
						</details>
					)}

					{problem.explanationTex && (
						<details className="group">
							<summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
								<SectionHeading title="解説" collapsible />
							</summary>
							<div className="pt-5">
								<MathText text={problem.explanationTex} />
							</div>
						</details>
					)}
				</div>

				<aside className="mt-10 lg:sticky lg:top-10 lg:mt-0">
					<ProblemFeed slug={slug} me={me} onSubmitted={reloadMe} />
				</aside>
			</div>
		</div>
	);
}
