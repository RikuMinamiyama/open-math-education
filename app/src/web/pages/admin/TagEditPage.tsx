import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiPost, apiPut, useFetch, type AdminTag, type AdminTagDetail } from "../../api";
import { BreadcrumbSeparator } from "../../components/Breadcrumb";

const SUBJECTS = ["数I", "数A", "数II", "数B", "数III", "数C"] as const;
const inputClass =
	"mt-2 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none";

export function TagEditPage() {
	const { slug } = useParams();
	const [searchParams] = useSearchParams();
	const isNew = !slug;
	const navigate = useNavigate();

	const initialKind = searchParams.get("kind") === "topic" ? "topic" : "unit";
	const { data: tagData } = useFetch<{ tags: AdminTag[] }>("/api/admin/tags");
	const { data, error: loadError } = useFetch<{ tag: AdminTagDetail }>(isNew ? null : `/api/admin/tags/${slug}`);

	const units = (tagData?.tags ?? []).filter((t) => t.kind === "unit");

	const [form, setForm] = useState({
		slug: "",
		name: "",
		kind: initialKind as "unit" | "topic",
		subject: "数I",
		parentSlug: "",
		sortOrder: "",
	});
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		if (data?.tag) {
			const t = data.tag;
			setForm({
				slug: t.slug,
				name: t.name,
				kind: t.kind,
				subject: t.subject ?? "数I",
				parentSlug: t.parentSlug ?? "",
				sortOrder: t.sortOrder != null ? String(t.sortOrder) : "",
			});
		}
	}, [data]);

	useEffect(() => {
		if (isNew && units.length > 0 && !form.parentSlug) {
			setForm((f) => ({ ...f, parentSlug: units[0].slug }));
		}
	}, [isNew, units, form.parentSlug]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setBusy(true);
		setError(null);
		const sortOrder = form.sortOrder.trim() ? Number(form.sortOrder) : null;
		if (sortOrder != null && !Number.isInteger(sortOrder)) {
			setError("並び順は整数で入力してください");
			setBusy(false);
			return;
		}
		const body = {
			slug: form.slug,
			name: form.name,
			kind: form.kind,
			subject: form.kind === "unit" ? form.subject : null,
			parentSlug: form.kind === "topic" ? form.parentSlug : null,
			sortOrder,
		};
		try {
			if (isNew) {
				await apiPost("/api/admin/tags", body);
				navigate("/admin/tags");
			} else {
				await apiPut(`/api/admin/tags/${slug}`, body);
				navigate("/admin/tags");
			}
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setBusy(false);
		}
	}

	if (!isNew && loadError) return <p className="text-rose-600">{loadError}</p>;

	const title = isNew ? (form.kind === "unit" ? "単元を追加" : "項目を追加") : "タグを編集";

	return (
		<div className="mx-auto max-w-lg space-y-6">
			<nav className="flex flex-wrap items-center gap-x-1 text-sm text-stone-500">
				<Link to="/admin" className="hover:underline">
					問題管理
				</Link>
				<BreadcrumbSeparator />
				<Link to="/admin/tags" className="hover:underline">
					単元・項目
				</Link>
				<BreadcrumbSeparator />
				<span>{title}</span>
			</nav>

			<h1 className="text-xl font-bold">{title}</h1>

			<form onSubmit={handleSubmit} className="space-y-5">
				{isNew && (
					<label className="block text-sm">
						<span className="font-medium text-stone-900">種別</span>
						<select
							value={form.kind}
							onChange={(e) => setForm({ ...form, kind: e.target.value as "unit" | "topic" })}
							className={inputClass}
						>
							<option value="unit">単元</option>
							<option value="topic">項目</option>
						</select>
					</label>
				)}

				<label className="block text-sm">
					<span className="font-medium text-stone-900">名前</span>
					<input
						type="text"
						required
						value={form.name}
						onChange={(e) => setForm({ ...form, name: e.target.value })}
						className={inputClass}
					/>
				</label>

				<label className="block text-sm">
					<span className="font-medium text-stone-900">slug</span>
					<input
						type="text"
						required
						pattern="[a-z0-9][a-z0-9-]*"
						value={form.slug}
						onChange={(e) => setForm({ ...form, slug: e.target.value })}
						className={inputClass}
					/>
					<p className="mt-1 text-xs text-stone-500">半角英小文字・数字・ハイフン（URLに使われます）</p>
				</label>

				{form.kind === "unit" ? (
					<label className="block text-sm">
						<span className="font-medium text-stone-900">科目</span>
						<select
							value={form.subject}
							onChange={(e) => setForm({ ...form, subject: e.target.value })}
							className={inputClass}
						>
							{SUBJECTS.map((s) => (
								<option key={s} value={s}>
									{s}
								</option>
							))}
						</select>
					</label>
				) : (
					<label className="block text-sm">
						<span className="font-medium text-stone-900">所属単元</span>
						<select
							required
							value={form.parentSlug}
							onChange={(e) => setForm({ ...form, parentSlug: e.target.value })}
							className={inputClass}
						>
							{units.map((u) => (
								<option key={u.slug} value={u.slug}>
									{u.subject ? `${u.subject} / ` : ""}
									{u.name}
								</option>
							))}
						</select>
						<p className="mt-1 text-xs text-stone-500">改訂に伴い、別の単元へ移動できます</p>
					</label>
				)}

				<label className="block text-sm">
					<span className="font-medium text-stone-900">並び順</span>
					<input
						type="number"
						value={form.sortOrder}
						onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
						placeholder="空欄で自動"
						className={inputClass}
					/>
				</label>

				{error && <p className="text-sm text-rose-600">{error}</p>}

				<div className="flex gap-3">
					<button
						type="submit"
						disabled={busy}
						className="rounded-lg bg-brand-700 px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:bg-stone-300"
					>
						{busy ? "保存中..." : "保存"}
					</button>
					<Link to="/admin/tags" className="rounded-lg border border-stone-300 px-5 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">
						キャンセル
					</Link>
				</div>
			</form>
		</div>
	);
}
