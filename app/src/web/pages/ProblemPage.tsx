import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiPostForm, useFetch, type Me, type ProblemDetail } from "../api";
import { DifficultyStars } from "../components/badges";
import { MathText } from "../components/Katex";

export function ProblemPage() {
	const { slug } = useParams();
	const navigate = useNavigate();
	const { data, error, loading } = useFetch<{ problem: ProblemDetail }>(slug ? `/api/problems/${slug}` : null);
	const { data: me, reload: reloadMe } = useFetch<Me>("/api/me");

	const [files, setFiles] = useState<File[]>([]);
	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);

	if (loading) return <p className="text-stone-500">読み込み中...</p>;
	if (error) return <p className="text-rose-600">{error}</p>;
	if (!data) return null;

	const problem = data.problem;
	const remaining = me?.usage ? me.usage.limit - me.usage.used : null;

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (files.length === 0) return;
		setSubmitting(true);
		setSubmitError(null);
		try {
			const form = new FormData();
			for (const file of files) form.append("images", file);
			const res = await apiPostForm<{ id: string }>(`/api/problems/${slug}/submissions`, form);
			reloadMe();
			navigate(`/submissions/${res.id}`);
		} catch (err) {
			setSubmitError((err as Error).message);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="space-y-6">
			<nav className="text-sm text-stone-500">
				<Link to="/" className="hover:underline">
					単元一覧
				</Link>
				{problem.tags[0] && (
					<>
						<span className="mx-1">/</span>
						<Link to={`/units/${(problem.tags[0].parent ?? problem.tags[0]).slug}`} className="hover:underline">
							{(problem.tags[0].parent ?? problem.tags[0]).name}
						</Link>
						{problem.tags[0].parent && (
							<>
								<span className="mx-1">/</span>
								<span>{problem.tags[0].name}</span>
							</>
						)}
					</>
				)}
			</nav>

			<div className="flex items-start justify-between gap-3">
				<h1 className="text-xl font-bold">{problem.title}</h1>
				<DifficultyStars level={problem.difficulty} />
			</div>

			<section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
				<h2 className="mb-3 border-l-4 border-teal-600 pl-2 text-sm font-bold text-stone-600">問題</h2>
				<MathText text={problem.statementTex} />
				{problem.attribution && <p className="mt-4 text-xs text-stone-400">{problem.attribution}</p>}
			</section>

			<section className="rounded-xl border border-teal-200 bg-teal-50/60 p-5">
				<h2 className="mb-1 text-sm font-bold text-teal-900">答案を撮影してAI添削を受ける</h2>
				<p className="mb-4 text-xs text-teal-800">
					ノートに解いた答案を撮影してアップロードしてください。名前などの個人情報が写り込まないようにお願いします
				</p>
				{!me?.user ? (
					<p className="text-sm">
						添削を受けるには{" "}
						<Link to="/login" className="font-medium text-teal-700 underline">
							ログイン
						</Link>{" "}
						してください
					</p>
				) : (
					<form onSubmit={handleSubmit} className="space-y-3">
						<input
							type="file"
							accept="image/jpeg,image/png,image/webp"
							multiple
							onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 4))}
							className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-teal-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-teal-600"
						/>
						{previews.length > 0 && (
							<div className="flex flex-wrap gap-2">
								{previews.map((src, i) => (
									<img key={i} src={src} alt={`答案 ${i + 1}枚目`} className="h-24 rounded-lg border border-stone-200 object-cover" />
								))}
							</div>
						)}
						{submitError && <p className="text-sm text-rose-600">{submitError}</p>}
						<div className="flex items-center gap-3">
							<button
								type="submit"
								disabled={files.length === 0 || submitting || (remaining !== null && remaining <= 0)}
								className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:bg-stone-300"
							>
								{submitting ? "アップロード中..." : "添削を依頼する"}
							</button>
							{remaining !== null && (
								<span className="text-xs text-stone-500">本日あと{Math.max(remaining, 0)}回</span>
							)}
						</div>
					</form>
				)}
			</section>

			{problem.answerTex && (
				<details className="rounded-xl border border-stone-200 bg-white shadow-sm">
					<summary className="cursor-pointer select-none p-4 text-sm font-bold text-stone-600">解答を見る</summary>
					<div className="border-t border-stone-100 p-5">
						<MathText text={problem.answerTex} />
					</div>
				</details>
			)}

			{problem.explanationTex && (
				<details className="rounded-xl border border-stone-200 bg-white shadow-sm">
					<summary className="cursor-pointer select-none p-4 text-sm font-bold text-stone-600">解説を見る</summary>
					<div className="border-t border-stone-100 p-5">
						<MathText text={problem.explanationTex} />
					</div>
				</details>
			)}
		</div>
	);
}
