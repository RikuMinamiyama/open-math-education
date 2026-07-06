import { Link, useParams } from "react-router-dom";
import { isAdmin, useFetch, type AdminUnitGroup, type Me } from "../../api";
import { BreadcrumbSeparator } from "../../components/Breadcrumb";
import { AdminProblemTable } from "./AdminProblemTable";

interface AdminUnitResponse {
	unit: { slug: string; name: string; subject: string | null };
	groups: AdminUnitGroup[];
}

export function AdminUnitPage() {
	const { slug } = useParams();
	const { data, error, loading, reload } = useFetch<AdminUnitResponse>(slug ? `/api/admin/units/${slug}` : null);
	const { data: me } = useFetch<Me>("/api/me");

	if (loading) return <p className="text-stone-500">読み込み中...</p>;
	if (error) return <p className="text-rose-600">{error}</p>;
	if (!data) return null;

	return (
		<div className="space-y-8">
			<nav className="flex flex-wrap items-center gap-x-1 text-sm text-stone-500">
				<Link to="/admin" className="hover:underline">
					問題管理
				</Link>
				<BreadcrumbSeparator />
				<span>{data.unit.name}</span>
			</nav>
			<div className="flex flex-wrap items-center justify-between gap-4">
				<h1 className="text-xl font-bold">{data.unit.name}</h1>
				<Link
					to="/admin/problems/new"
					className="shrink-0 rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
				>
					新しい問題を作る
				</Link>
			</div>
			{data.groups.length === 0 ? (
				<p className="text-stone-500">この単元の問題はまだありません</p>
			) : (
				data.groups.map((group, i) => (
					<section key={group.topic?.slug ?? `direct-${i}`}>
						{group.topic && (
							<h2 className="mb-3 border-l-4 border-brand-600 pl-2 text-sm font-bold text-stone-600">{group.topic.name}</h2>
						)}
						<AdminProblemTable problems={group.problems} canDelete={isAdmin(me)} onDeleted={reload} />
					</section>
				))
			)}
		</div>
	);
}
