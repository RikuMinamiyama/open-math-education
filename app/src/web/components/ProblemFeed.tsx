import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon, PaperClipIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { apiPost, apiPostForm, useFetch, type ActivityItem, type Me, type SelfCheckResult } from '../api';
import { StatusBadge, VerdictBadge } from './badges';

const MAX_IMAGES = 4;

const SELF_CHECK_STYLES: Record<SelfCheckResult, { symbol: string; label: string; className: string }> = {
	correct: { symbol: '○', label: 'できた', className: 'bg-emerald-50 text-emerald-600 ring-emerald-300' },
	partial: { symbol: '△', label: 'おしい', className: 'bg-amber-50 text-amber-600 ring-amber-300' },
	wrong: { symbol: '×', label: 'できなかった', className: 'bg-rose-50 text-rose-600 ring-rose-300' },
};

function classNames(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(' ');
}

function formatDateTime(value: string) {
	return new Date(value).toLocaleString('ja-JP', {
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

function FeedItem({ item, isLast }: { item: ActivityItem; isLast: boolean }) {
	return (
		<li className="relative flex gap-x-3">
			<div className={classNames(isLast ? 'h-6' : '-bottom-6', 'absolute top-0 left-0 flex w-6 justify-center')}>
				<div className="w-px bg-stone-200" />
			</div>
			{item.type === 'self_check' ? (
				<>
					<div className="relative flex size-6 flex-none items-center justify-center bg-stone-50">
						<span
							className={classNames(
								'flex size-5 items-center justify-center rounded-full text-[11px] font-bold ring-1',
								SELF_CHECK_STYLES[item.result].className,
							)}
						>
							{SELF_CHECK_STYLES[item.result].symbol}
						</span>
					</div>
					<p className="flex-auto py-0.5 text-xs/5 text-stone-500">
						<span className="font-medium text-stone-900">{item.attemptNo}回目</span>の記録 {SELF_CHECK_STYLES[item.result].label}
					</p>
					<time dateTime={item.createdAt} className="flex-none py-0.5 text-xs/5 text-stone-400">
						{formatDateTime(item.createdAt)}
					</time>
				</>
			) : (
				<>
					<div className="relative flex size-6 flex-none items-center justify-center bg-stone-50">
						{item.status === 'graded' ? (
							<CheckCircleIcon aria-hidden="true" className="size-6 text-brand-600" />
						) : (
							<div className="mt-3 size-1.5 rounded-full bg-stone-100 ring ring-stone-300" />
						)}
					</div>
					<div className="flex-auto rounded-md p-3 ring-1 ring-stone-200 ring-inset">
						<div className="flex items-center justify-between gap-x-2">
							<span className="text-xs/5 font-medium text-stone-900">添削依頼</span>
							<time dateTime={item.createdAt} className="flex-none text-xs/5 text-stone-400">
								{formatDateTime(item.createdAt)}
							</time>
						</div>
						{item.message && <p className="mt-1.5 text-sm/6 whitespace-pre-wrap text-stone-600">{item.message}</p>}
						<div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
							{item.verdict ? <VerdictBadge verdict={item.verdict} /> : <StatusBadge status={item.status} />}
							{item.status === 'graded' && (
								<Link
									to={`/submissions/${item.id}`}
									className="inline-flex items-center gap-0.5 text-xs font-medium text-brand-700 hover:underline"
								>
									添削結果を確認する
									<ChevronRightIcon aria-hidden="true" className="size-3.5" />
								</Link>
							)}
						</div>
					</div>
				</>
			)}
		</li>
	);
}

export function ProblemFeed({ slug, me, onSubmitted }: { slug: string; me: Me | null; onSubmitted: () => void }) {
	const loggedIn = Boolean(me?.user);
	const { data, reload } = useFetch<{ items: ActivityItem[] }>(loggedIn ? `/api/problems/${slug}/activity` : null);
	const items = useMemo(() => data?.items ?? [], [data]);

	const [message, setMessage] = useState('');
	const [files, setFiles] = useState<File[]>([]);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [checkSaving, setCheckSaving] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLDivElement>(null);

	const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
	const remaining = me?.usage ? me.usage.limit - me.usage.used : null;

	// 添削完了までポーリングする
	const pending = items.some(
		(i) => i.type === 'submission' && (i.status === 'uploaded' || i.status === 'queued' || i.status === 'grading'),
	);
	useEffect(() => {
		if (!pending) return;
		const timer = setTimeout(reload, 3000);
		return () => clearTimeout(timer);
	}, [pending, data, reload]);

	// 新しい項目が増えたら最新まで送る
	useEffect(() => {
		listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
	}, [items.length]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (files.length === 0) {
			setError('答案の画像を選択してください');
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			const form = new FormData();
			for (const file of files) form.append('images', file);
			if (message.trim()) form.append('message', message.trim());
			await apiPostForm<{ id: string }>(`/api/problems/${slug}/submissions`, form);
			setMessage('');
			setFiles([]);
			if (fileInputRef.current) fileInputRef.current.value = '';
			reload();
			onSubmitted();
			// サイドバーの残り回数チップを更新する
			window.dispatchEvent(new Event('usage-changed'));
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setSubmitting(false);
		}
	}

	async function recordSelfCheck(result: SelfCheckResult) {
		setCheckSaving(true);
		setError(null);
		try {
			await apiPost(`/api/problems/${slug}/self-checks`, { result });
			reload();
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setCheckSaving(false);
		}
	}

	return (
		<div className="flex h-full min-h-80 flex-col bg-stone-50 lg:min-h-0">
			<div className="shrink-0 px-4 py-3">
				<h2 className="text-sm font-semibold text-stone-900">添削・学習記録</h2>
			</div>

			{!loggedIn ? (
				<div className="px-4 py-6 text-sm text-stone-600">
					添削の依頼や学習記録には{' '}
					<Link to="/login" className="font-medium text-brand-700 underline">
						ログイン
					</Link>{' '}
					してください
				</div>
			) : (
				<>
					<div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4">
						{items.length === 0 ? (
							<p className="text-sm text-stone-500">まだ記録がありません</p>
						) : (
							<ul role="list" className="space-y-6">
								{items.map((item, idx) => (
									<FeedItem key={`${item.type}-${item.id}`} item={item} isLast={idx === items.length - 1} />
								))}
							</ul>
						)}
					</div>

					<div className="shrink-0 space-y-3 bg-stone-50 px-4 py-3">
						<div className="flex items-center gap-2">
							<span className="text-xs text-stone-500">学習記録をつける</span>
							{(Object.keys(SELF_CHECK_STYLES) as SelfCheckResult[]).map((result) => (
								<button
									key={result}
									type="button"
									onClick={() => recordSelfCheck(result)}
									disabled={checkSaving}
									title={SELF_CHECK_STYLES[result].label}
									className={classNames(
										'flex size-8 items-center justify-center rounded-full text-base font-bold ring-1 transition hover:brightness-95 disabled:opacity-50',
										SELF_CHECK_STYLES[result].className,
									)}
								>
									{SELF_CHECK_STYLES[result].symbol}
								</button>
							))}
						</div>

						{previews.length > 0 && (
							<div className="flex flex-wrap gap-2">
								{previews.map((src, i) => (
									<div key={i} className="relative">
										<img src={src} alt={`答案 ${i + 1}枚目`} className="h-16 rounded-lg border border-stone-200 object-cover" />
										<button
											type="button"
											onClick={() => setFiles(files.filter((_, j) => j !== i))}
											className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-stone-700 text-white hover:bg-stone-900"
										>
											<XMarkIcon aria-hidden="true" className="size-3.5" />
											<span className="sr-only">{i + 1}枚目を削除</span>
										</button>
									</div>
								))}
							</div>
						)}

						<form onSubmit={handleSubmit} className="relative">
							<div className="overflow-hidden rounded-lg pb-12 outline-1 -outline-offset-1 outline-stone-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-brand-600">
								<label htmlFor="feed-message" className="sr-only">
									添削へのメッセージ
								</label>
								<textarea
									id="feed-message"
									rows={2}
									value={message}
									maxLength={500}
									onChange={(e) => setMessage(e.target.value)}
									placeholder="見てほしい観点があれば書いてください（例：途中までですが方針を見てほしい）"
									className="block w-full resize-none bg-transparent px-3 py-1.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none"
								/>
							</div>
							<div className="absolute inset-x-0 bottom-0 flex items-center justify-between py-2 pr-2 pl-2">
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									className="-m-1 flex size-8 items-center justify-center rounded-full text-stone-400 hover:text-stone-600"
								>
									<PaperClipIcon aria-hidden="true" className="size-5" />
									<span className="sr-only">答案の画像を選ぶ</span>
								</button>
								<button
									type="submit"
									disabled={files.length === 0 || submitting || (remaining !== null && remaining <= 0)}
									className="rounded-lg bg-brand-700 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-stone-300"
								>
									{submitting ? '送信中...' : '添削を依頼'}
								</button>
							</div>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/jpeg,image/png,image/webp"
								multiple
								onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, MAX_IMAGES))}
								className="hidden"
							/>
						</form>

						{error && <p className="text-xs text-rose-600">{error}</p>}
						<p className="text-xs text-stone-400">答案は名前などの個人情報が写り込まないように撮影してください</p>
					</div>
				</>
			)}
		</div>
	);
}
