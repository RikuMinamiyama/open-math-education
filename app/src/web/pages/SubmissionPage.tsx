import { ChevronLeftIcon } from '@heroicons/react/20/solid';
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useFetch, type SubmissionDetail } from '../api';
import { BreadcrumbSeparator } from '../components/Breadcrumb';
import { StatusBadge, VerdictBadge } from '../components/badges';
import { MathText } from '../components/Katex';
import { SectionHeading } from '../components/SectionHeading';

const ERROR_TYPE_LABELS: Record<string, string> = {
	calculation: '計算ミス',
	logic: '論理の誤り',
	misconception: '概念の誤解',
	notation: '記法の誤り',
	incomplete: '解答の不足',
};

function describeGradingFailure(lastError: string | null | undefined): string {
	const text = lastError?.toLowerCase() ?? '';
	if (text.includes('401') || text.includes('authentication')) {
		return 'Anthropic APIキーが無効です。Cloudflare のシークレット ANTHROPIC_API_KEY を確認してください';
	}
	if (text.includes('403') || text.includes('permission') || text.includes('do not have access')) {
		return 'このAPIキーでは指定モデルを使えません。GRADING_MODEL を claude-sonnet-5 にするか、Anthropic の利用枠を確認してください';
	}
	if (text.includes('402') || text.includes('billing') || text.includes('credit')) {
		return 'Anthropic の請求設定を確認してください';
	}
	if (text.includes('429') || text.includes('rate_limit')) {
		return 'APIの利用上限に達しています。しばらく待ってから再度アップロードしてください';
	}
	if (text.includes('529') || text.includes('overloaded')) {
		return 'Anthropic 側が混み合っています。しばらく待ってから再度アップロードしてください';
	}
	if (text.includes('10mb') || text.includes('exceeds') || text.includes('request size')) {
		return '答案画像が大きすぎます。もう少し離して撮影するか、枚数を減らしてください';
	}
	if (text.includes('400') || text.includes('invalid_request')) {
		return '添削リクエストが API に拒否されました。画像形式を変えて再度アップロードしてください';
	}
	return '時間をおいてもう一度アップロードしてください';
}

export function SubmissionPage() {
	const { id } = useParams();
	const { data, error, loading, reload } = useFetch<{ submission: SubmissionDetail }>(id ? `/api/submissions/${id}` : null);

	const submission = data?.submission;
	const pending = submission && (submission.status === 'uploaded' || submission.status === 'queued' || submission.status === 'grading');

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
			<nav className="flex flex-wrap items-center gap-x-1 text-sm text-stone-500">
				<Link to="/" className="hover:underline">
					単元一覧
				</Link>
				{submission.problem && (
					<>
						<BreadcrumbSeparator />
						<Link to={`/problems/${submission.problem.slug}`} className="hover:underline">
							{submission.problem.title}
						</Link>
					</>
				)}
				<BreadcrumbSeparator />
				<span>添削結果</span>
			</nav>

			{submission.problem && (
				<Link
					to={`/problems/${submission.problem.slug}`}
					className="inline-flex items-center gap-0.5 text-sm font-medium text-brand-700 hover:underline"
				>
					<ChevronLeftIcon aria-hidden="true" className="size-3.5" />
					問題ページに戻る
				</Link>
			)}

			<div className="flex flex-wrap items-center justify-between gap-3">
				<h1 className="text-xl font-bold">
					{submission.problem ? (
						<Link to={`/problems/${submission.problem.slug}`} className="hover:underline">
							{submission.problem.title}
						</Link>
					) : (
						'添削結果'
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

			{submission.studentMessage && (
				<div className="rounded-md p-3 ring-1 ring-stone-200 ring-inset">
					<p className="text-xs font-medium text-stone-500">依頼時のメッセージ</p>
					<p className="mt-1 text-sm whitespace-pre-wrap text-stone-700">{submission.studentMessage}</p>
				</div>
			)}

			{pending && (
				<div className="rounded-xl border border-sky-200 bg-sky-50 p-5 text-sm text-sky-900">
					<p className="font-medium">AIが答案を読んでいます...</p>
					<p className="mt-1 text-xs">添削には1〜2分ほどかかることがあります。このページを開いたままお待ちください</p>
				</div>
			)}

			{submission.status === 'failed' && (
				<div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
					<p className="font-medium">添削処理に失敗しました</p>
					<p className="mt-1">{describeGradingFailure(submission.lastError)}</p>
					{submission.lastError && (
						<details className="mt-3">
							<summary className="cursor-pointer text-xs text-rose-700">技術的な詳細</summary>
							<p className="mt-1 font-mono text-xs break-all text-rose-700">{submission.lastError}</p>
						</details>
					)}
				</div>
			)}

			{submission.grading && feedback && (
				<div className="space-y-8">
					<section>
						<SectionHeading title="添削" />
						<div className="space-y-3 pt-5">
							<div className="flex items-center gap-3">
								<VerdictBadge verdict={submission.grading.verdict} />
								{submission.grading.model === 'mock' && <span className="text-xs text-stone-400">モック添削（APIキー未設定）</span>}
							</div>
							<MathText text={feedback.overall_comment} />
						</div>
					</section>

					{feedback.steps.length > 0 && (
						<section>
							<SectionHeading title="ステップごとの評価" />
							<ul className="space-y-4 pt-5">
								{feedback.steps.map((step, i) => (
									<li key={i} className="flex gap-3">
										<span className={`mt-0.5 text-lg leading-none ${step.ok ? 'text-emerald-500' : 'text-rose-500'}`}>
											{step.ok ? '○' : '×'}
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
						<section>
							<SectionHeading title="見直しポイント" />
							<ul className="space-y-5 pt-5">
								{feedback.errors.map((err, i) => (
									<li key={i}>
										<div className="mb-1 flex flex-wrap items-center gap-2">
											<span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800">
												{ERROR_TYPE_LABELS[err.type] ?? err.type}
											</span>
											<MathText text={err.location} className="text-xs text-stone-500" />
										</div>
										<MathText text={err.explanation} className="text-sm" />
										<div className="mt-2 flex gap-2 text-sm text-stone-700">
											<span className="shrink-0 font-semibold">ヒント</span>
											<MathText text={err.hint} />
										</div>
									</li>
								))}
							</ul>
						</section>
					)}

					<section>
						<SectionHeading title="次のおすすめ" />
						<div className="pt-5">
							<MathText text={feedback.next_recommendation} className="text-sm" />
						</div>
					</section>

					<details className="group">
						<summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
							<SectionHeading title="読み取った答案" collapsible />
						</summary>
						<div className="pt-5">
							<MathText text={feedback.transcription} className="text-sm" />
						</div>
					</details>
				</div>
			)}
		</div>
	);
}
