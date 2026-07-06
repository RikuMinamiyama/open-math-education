import { useMemo, useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";
import { Link } from "react-router-dom";
import { apiDelete, type AdminProblemInUnit } from "../../api";
import { DifficultyStars } from "../../components/badges";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
	published: { label: "公開中", className: "bg-emerald-100 text-emerald-800" },
	draft: { label: "下書き", className: "bg-stone-200 text-stone-700" },
	archived: { label: "非公開", className: "bg-stone-200 text-stone-500" },
};

type SortKey = "title" | "updatedByName" | "updatedAt" | "difficulty" | "status";
type SortDir = "asc" | "desc";

function formatDate(value: string) {
	return new Date(value).toLocaleDateString("ja-JP", { year: "numeric", month: "numeric", day: "numeric" });
}

function SortButton({
	label,
	active,
	dir,
	onClick,
	className,
}: {
	label: string;
	active: boolean;
	dir: SortDir;
	onClick: () => void;
	className?: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`group inline-flex items-center gap-1 text-left text-xs font-semibold uppercase tracking-wide text-stone-500 hover:text-stone-700 ${className ?? ""}`}
		>
			{label}
			<span className={active ? "text-stone-700" : "invisible size-3.5"}>
				{dir === "desc" ? (
					<ChevronDownIcon aria-hidden="true" className="size-3.5" />
				) : (
					<ChevronUpIcon aria-hidden="true" className="size-3.5" />
				)}
			</span>
		</button>
	);
}

export function AdminProblemTable({
	problems,
	canDelete,
	onDeleted,
}: {
	problems: AdminProblemInUnit[];
	canDelete: boolean;
	onDeleted: () => void;
}) {
	const [sortKey, setSortKey] = useState<SortKey>("difficulty");
	const [sortDir, setSortDir] = useState<SortDir>("asc");
	const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const sorted = useMemo(() => {
		return [...problems].sort((a, b) => {
			let cmp = 0;
			switch (sortKey) {
				case "title":
					cmp = a.title.localeCompare(b.title, "ja");
					break;
				case "updatedByName":
					cmp = (a.updatedByName ?? "").localeCompare(b.updatedByName ?? "", "ja");
					break;
				case "updatedAt":
					cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
					break;
				case "difficulty":
					cmp = a.difficulty - b.difficulty;
					break;
				case "status":
					cmp = a.status.localeCompare(b.status, "ja");
					break;
			}
			return sortDir === "asc" ? cmp : -cmp;
		});
	}, [problems, sortKey, sortDir]);

	function toggleSort(key: SortKey) {
		if (sortKey === key) {
			setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
			return;
		}
		setSortKey(key);
		setSortDir("asc");
	}

	async function handleDelete(problem: AdminProblemInUnit) {
		if (!window.confirm(`「${problem.title}」を削除しますか？\nこの操作は取り消せません。`)) return;
		setDeletingSlug(problem.slug);
		setError(null);
		try {
			await apiDelete(`/api/admin/problems/${problem.slug}`);
			onDeleted();
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setDeletingSlug(null);
		}
	}

	return (
		<div>
			{error && <p className="mb-3 text-sm text-rose-600">{error}</p>}
			<div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
				<table className="min-w-full divide-y divide-stone-200">
					<thead>
						<tr className="bg-stone-50">
							<th scope="col" className="px-4 py-3 text-left">
								<SortButton label="問題" active={sortKey === "title"} dir={sortDir} onClick={() => toggleSort("title")} />
							</th>
							<th scope="col" className="px-4 py-3 text-left">
								<SortButton
									label="更新者"
									active={sortKey === "updatedByName"}
									dir={sortDir}
									onClick={() => toggleSort("updatedByName")}
								/>
							</th>
							<th scope="col" className="px-4 py-3 text-left">
								<SortButton
									label="更新日"
									active={sortKey === "updatedAt"}
									dir={sortDir}
									onClick={() => toggleSort("updatedAt")}
								/>
							</th>
							<th scope="col" className="px-4 py-3 text-right">
								<SortButton
									label="難易度"
									active={sortKey === "difficulty"}
									dir={sortDir}
									onClick={() => toggleSort("difficulty")}
									className="ml-auto"
								/>
							</th>
							<th scope="col" className="px-4 py-3 text-right">
								<SortButton
									label="状態"
									active={sortKey === "status"}
									dir={sortDir}
									onClick={() => toggleSort("status")}
									className="ml-auto"
								/>
							</th>
							<th scope="col" className="py-3 pr-4 pl-3 text-right sm:pr-4">
								<span className="sr-only">操作</span>
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-stone-200">
						{sorted.map((problem) => {
							const status = STATUS_LABELS[problem.status] ?? STATUS_LABELS.draft;
							const busy = deletingSlug === problem.slug;
							return (
								<tr key={problem.slug} className="transition hover:bg-stone-50">
									<td className="px-4 py-3">
										<div className="font-medium text-stone-900">{problem.title}</div>
										<div className="mt-0.5 text-xs text-stone-400">
											<code>{problem.slug}</code>
										</div>
									</td>
									<td className="px-4 py-3 text-sm text-stone-600">{problem.updatedByName ?? "—"}</td>
									<td className="px-4 py-3 text-sm text-stone-600">{formatDate(problem.updatedAt)}</td>
									<td className="px-4 py-3 text-right">
										<DifficultyStars level={problem.difficulty} />
									</td>
									<td className="px-4 py-3 text-right">
										<span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.className}`}>
											{status.label}
										</span>
									</td>
									<td className="py-3 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap">
										<Link
											to={`/admin/problems/${problem.slug}`}
											className="text-brand-700 hover:text-brand-900"
										>
											編集
										</Link>
										{canDelete && (
											<>
												<span className="mx-2 text-stone-300">|</span>
												<button
													type="button"
													onClick={() => handleDelete(problem)}
													disabled={busy}
													className="text-rose-600 hover:text-rose-800 disabled:opacity-50"
												>
													{busy ? "削除中..." : "削除"}
												</button>
											</>
										)}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}
