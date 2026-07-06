import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
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
		<div className="-mx-4 flex min-h-0 flex-1 flex-col sm:-mx-6 lg:-mx-8">
			<div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:grid-rows-[auto_1fr] lg:overflow-hidden">
				<nav className="flex flex-wrap items-center gap-x-1 px-4 text-sm text-stone-500 sm:px-6 lg:col-start-1 lg:row-start-1 lg:px-8 lg:pr-10 xl:pr-12">
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

				<div className="flex flex-col overflow-y-auto px-4 pt-8 sm:px-6 lg:col-start-1 lg:row-start-2 lg:px-8 lg:pt-0 lg:pr-10 xl:pr-12">
					<div className="flex flex-1 flex-col space-y-8">
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

						{(problem.prev || problem.next) && (
							<nav className="mt-auto flex items-start justify-between gap-6 pt-6 pb-4">
								{problem.prev ? (
									<Link to={`/problems/${problem.prev.slug}`} className="group min-w-0">
										<span className="text-xs text-stone-500">前の問題</span>
										<span className="mt-1 flex items-center gap-1 text-sm font-semibold text-stone-900 group-hover:text-brand-700">
											<ChevronLeftIcon aria-hidden="true" className="size-4 shrink-0 text-stone-400 group-hover:text-brand-700" />
											<span className="truncate">{problem.prev.title}</span>
										</span>
									</Link>
								) : (
									<span />
								)}
								{problem.next ? (
									<Link to={`/problems/${problem.next.slug}`} className="group min-w-0 text-right">
										<span className="text-xs text-stone-500">次の問題</span>
										<span className="mt-1 flex items-center justify-end gap-1 text-sm font-semibold text-stone-900 group-hover:text-brand-700">
											<span className="truncate">{problem.next.title}</span>
											<ChevronRightIcon aria-hidden="true" className="size-4 shrink-0 text-stone-400 group-hover:text-brand-700" />
										</span>
									</Link>
								) : (
									<span />
								)}
							</nav>
						)}
					</div>
				</div>

				<aside className="mt-10 flex min-h-80 flex-col border-t border-stone-200 lg:col-start-2 lg:row-start-2 lg:mt-0 lg:min-h-0 lg:border-l lg:border-t-0">
					<ProblemFeed slug={slug} me={me} onSubmitted={reloadMe} />
				</aside>
			</div>
		</div>
	);
}
