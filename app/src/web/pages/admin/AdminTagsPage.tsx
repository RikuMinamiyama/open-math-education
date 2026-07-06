import { Link } from "react-router-dom";
import { apiDelete, isAdmin, useFetch, type AdminTag, type Me } from "../../api";

const SUBJECT_ORDER = ["数I", "数A", "数II", "数B", "数III", "数C"] as const;

function kindLabel(kind: AdminTag["kind"]) {
	return kind === "unit" ? "単元" : "項目";
}

export function AdminTagsPage() {
	const { data, error, loading, reload } = useFetch<{ tags: AdminTag[] }>("/api/admin/tags");
	const { data: me } = useFetch<Me>("/api/me");

	if (loading) return <p className="text-stone-500">読み込み中...</p>;
	if (error) return <p className="text-rose-600">{error}</p>;

	const allTags = data?.tags ?? [];
	const units = allTags.filter((t) => t.kind === "unit");
	const topicsByUnit = new Map<string, AdminTag[]>();
	for (const topic of allTags.filter((t) => t.kind === "topic")) {
		const key = topic.parentSlug ?? "";
		topicsByUnit.set(key, [...(topicsByUnit.get(key) ?? []), topic]);
	}

	const unitsBySubject = new Map<string, AdminTag[]>();
	for (const unit of units) {
		const key = unit.subject ?? "その他";
		unitsBySubject.set(key, [...(unitsBySubject.get(key) ?? []), unit]);
	}

	const subjects = [
		...SUBJECT_ORDER.filter((s) => unitsBySubject.has(s)),
		...[...unitsBySubject.keys()].filter((s) => !SUBJECT_ORDER.includes(s as (typeof SUBJECT_ORDER)[number])),
	];

	async function handleDelete(tag: AdminTag) {
		if (!window.confirm(`「${tag.name}」を削除しますか？\nこの操作は取り消せません。`)) return;
		try {
			await apiDelete(`/api/admin/tags/${tag.slug}`);
			reload();
		} catch (err) {
			window.alert((err as Error).message);
		}
	}

	function ActionLinks({ tag }: { tag: AdminTag }) {
		return (
			<div className="text-right text-sm font-medium whitespace-nowrap">
				<Link to={`/admin/tags/${tag.slug}`} className="text-brand-700 hover:text-brand-900">
					編集
				</Link>
				{isAdmin(me) && (
					<>
						<span className="mx-2 text-stone-300">|</span>
						<button type="button" onClick={() => handleDelete(tag)} className="text-rose-600 hover:text-rose-800">
							削除
						</button>
					</>
				)}
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<nav className="mb-2 text-sm text-stone-500">
						<Link to="/admin" className="hover:underline">
							問題管理
						</Link>
						<span className="mx-1">/</span>
						<span>単元・項目</span>
					</nav>
					<h1 className="text-xl font-bold">単元・項目の管理</h1>
				</div>
				<div className="flex flex-wrap gap-2">
					<Link
						to="/admin/tags/new?kind=unit"
						className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 transition hover:bg-stone-50"
					>
						単元を追加
					</Link>
					<Link
						to="/admin/tags/new?kind=topic"
						className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
					>
						項目を追加
					</Link>
				</div>
			</div>

			{subjects.length === 0 ? (
				<p className="text-stone-500">まだ単元がありません</p>
			) : (
				subjects.map((subject) => (
					<section key={subject}>
						<h2 className="mb-3 text-sm font-bold text-stone-500">{subject}</h2>
						<div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
							<table className="min-w-full divide-y divide-stone-200">
								<thead>
									<tr className="bg-stone-50">
										<th scope="col" className="py-3 pr-3 pl-4 text-left text-sm font-semibold text-stone-900 sm:pl-4">
											名前
										</th>
										<th scope="col" className="px-3 py-3 text-left text-sm font-semibold text-stone-900">
											slug
										</th>
										<th scope="col" className="px-3 py-3 text-left text-sm font-semibold text-stone-900">
											種別
										</th>
										<th scope="col" className="px-3 py-3 text-left text-sm font-semibold text-stone-900">
											所属
										</th>
										<th scope="col" className="px-3 py-3 text-right text-sm font-semibold text-stone-900">
											並び順
										</th>
										<th scope="col" className="py-3 pr-4 pl-3 sm:pr-4">
											<span className="sr-only">操作</span>
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-stone-200">
									{(unitsBySubject.get(subject) ?? []).flatMap((unit) => {
										const topics = topicsByUnit.get(unit.slug) ?? [];
										const unitRow = (
											<tr key={unit.slug} className="hover:bg-stone-50">
												<td className="py-4 pr-3 pl-4 text-sm font-medium text-stone-900 sm:pl-4">{unit.name}</td>
												<td className="px-3 py-4 text-sm text-stone-500">
													<code>{unit.slug}</code>
												</td>
												<td className="px-3 py-4 text-sm text-stone-500">{kindLabel(unit.kind)}</td>
												<td className="px-3 py-4 text-sm text-stone-500">{unit.subject ?? "—"}</td>
												<td className="px-3 py-4 text-right text-sm text-stone-500">{unit.sortOrder ?? "—"}</td>
												<td className="py-4 pr-4 pl-3 sm:pr-4">
													<ActionLinks tag={unit} />
												</td>
											</tr>
										);
										const topicRows = topics.map((topic) => (
											<tr key={topic.slug} className="bg-stone-50/50 hover:bg-stone-50">
												<td className="py-4 pr-3 pl-8 text-sm text-stone-900 sm:pl-10">
													<span className="text-stone-400">└ </span>
													{topic.name}
												</td>
												<td className="px-3 py-4 text-sm text-stone-500">
													<code>{topic.slug}</code>
												</td>
												<td className="px-3 py-4 text-sm text-stone-500">{kindLabel(topic.kind)}</td>
												<td className="px-3 py-4 text-sm text-stone-500">{topic.parentName ?? unit.name}</td>
												<td className="px-3 py-4 text-right text-sm text-stone-500">{topic.sortOrder ?? "—"}</td>
												<td className="py-4 pr-4 pl-3 sm:pr-4">
													<ActionLinks tag={topic} />
												</td>
											</tr>
										));
										return [unitRow, ...topicRows];
									})}
								</tbody>
							</table>
						</div>
					</section>
				))
			)}
		</div>
	);
}
