import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useFetch, type SubmissionDetail } from "../api";
import { StatusBadge, VerdictBadge } from "../components/badges";
import { MathText } from "../components/Katex";

const ERROR_TYPE_LABELS: Record<string, string> = {
	calculation: "計算ミス",
	logic: "論理の誤り",
	misconception: "概念の誤解",
	notation: "記法の誤り",
	incomplete: "解答の不足",
};

export function SubmissionPage() {
	const { id } = useParams();
	const { data, error, loading, reload } = useFetch<{ submission: SubmissionDetail }>(
		id ? `/api/submissions/${id}` : null,
	);

	const submission = data?.submission;
	const pending =
		submission && (submission.status === "uploaded" || submission.status === "queued" || submission.status === "grading");

	// 添削完了までポーリングする
	useEffect(() => {
		if (!pending) return;
		const timer = setTimeout(reload, 3000);
		return () => clearTimeout(timer);
	}, [pending, data, reload]);

	if (loading && !data) return <p className="text-stone-500">読み込み中...</p>;
	if (error) return <p className="text-rose-600">{error}</p>;
	if (!submission) return null;

	const feedback = submission.grading?.feedback;

	return (
		<div className="space-y-6">
			<nav className="text-sm text-stone-500">
				<Link to="/history" className="hover:underline">
					学習履歴
				</Link>
				<span className="mx-1">/</span>
				<span>添削結果</span>
			</nav>

			<div className="flex flex-wrap items-center justify-between gap-3">
				<h1 className="text-xl font-bold">
					{submission.problem ? (
						<Link to={`/problems/${submission.problem.slug}`} className="hover:underline">
							{submission.problem.title}
						</Link>
					) : (
						"添削結果"
					)}
				</h1>
				<StatusBadge status={submission.status} />
			</div>

			{submission.images.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{submission.images.map((img) => (
						<a key={img.id} href={`/api/submissions/${submission.id}/images/${img.id}`} target="_blank" rel="noreferrer">
							<img
								src={`/api/submissions/${submission.id}/images/${img.id}`}
								alt={`答案 ${img.pageNo}枚目`}
								className="h-28 rounded-lg border border-stone-200 object-cover"
							/>
						</a>
					))}
				</div>
			)}

			{pending && (
				<div className="rounded-xl border border-sky-200 bg-sky-50 p-5 text-sm text-sky-900">
					<p className="font-medium">AIが答案を読んでいます...</p>
					<p className="mt-1 text-xs">添削には1〜2分ほどかかることがあります。このページを開いたままお待ちください</p>
				</div>
			)}

			{submission.status === "failed" && (
				<div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
					添削処理に失敗しました。時間をおいてもう一度アップロードしてください
				</div>
			)}

			{submission.grading && feedback && (
				<div className="space-y-4">
					<section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
						<div className="mb-3 flex items-center gap-3">
							<VerdictBadge verdict={submission.grading.verdict} />
							{submission.grading.model === "mock" && (
								<span className="text-xs text-stone-400">モック添削（APIキー未設定）</span>
							)}
						</div>
						<MathText text={feedback.overall_comment} />
					</section>

					{feedback.steps.length > 0 && (
						<section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
							<h2 className="mb-3 border-l-4 border-teal-600 pl-2 text-sm font-bold text-stone-600">ステップごとの評価</h2>
							<ul className="space-y-3">
								{feedback.steps.map((step, i) => (
									<li key={i} className="flex gap-3">
										<span className={`mt-0.5 text-lg leading-none ${step.ok ? "text-emerald-500" : "text-rose-500"}`}>
											{step.ok ? "○" : "×"}
										</span>
										<div>
											<MathText text={step.summary} className="text-sm font-medium" />
											<MathText text={step.comment} className="text-sm text-stone-600" />
										</div>
									</li>
								))}
							</ul>
						</section>
					)}

					{feedback.errors.length > 0 && (
						<section className="rounded-xl border border-rose-200 bg-white p-5 shadow-sm">
							<h2 className="mb-3 border-l-4 border-rose-500 pl-2 text-sm font-bold text-stone-600">見直しポイント</h2>
							<ul className="space-y-4">
								{feedback.errors.map((err, i) => (
									<li key={i} className="rounded-lg bg-rose-50/60 p-4">
										<div className="mb-1 flex items-center gap-2">
											<span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800">
												{ERROR_TYPE_LABELS[err.type] ?? err.type}
											</span>
											<MathText text={err.location} className="text-xs text-stone-500" />
										</div>
										<MathText text={err.explanation} className="text-sm" />
										<div className="mt-2 flex gap-2 text-sm text-teal-900">
											<span className="shrink-0 font-bold">ヒント</span>
											<MathText text={err.hint} />
										</div>
									</li>
								))}
							</ul>
						</section>
					)}

					<section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
						<h2 className="mb-2 border-l-4 border-teal-600 pl-2 text-sm font-bold text-stone-600">次のおすすめ</h2>
						<MathText text={feedback.next_recommendation} className="text-sm" />
					</section>

					<details className="rounded-xl border border-stone-200 bg-white shadow-sm">
						<summary className="cursor-pointer select-none p-4 text-sm font-bold text-stone-600">
							AIが読み取った答案を確認する
						</summary>
						<div className="border-t border-stone-100 p-5">
							<MathText text={feedback.transcription} className="text-sm" />
						</div>
					</details>
				</div>
			)}
		</div>
	);
}
