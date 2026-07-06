import { useEffect, useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel, TransitionChild } from "@headlessui/react";
import {
	ArrowRightOnRectangleIcon,
	ArrowRightStartOnRectangleIcon,
	Bars3Icon,
	Cog6ToothIcon,
	HomeIcon,
	UserPlusIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { isEditor, useFetch, type Me } from "../api";
import { signOut, useSession } from "../auth-client";

function classNames(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

type NavItem = {
	name: string;
	to: string;
	icon: typeof HomeIcon;
};

function useNavigation(session: ReturnType<typeof useSession>["data"], me: Me | null): NavItem[] {
	const items: NavItem[] = [{ name: "単元一覧", to: "/", icon: HomeIcon }];

	if (session?.user && isEditor(me)) {
		items.push({ name: "管理", to: "/admin", icon: Cog6ToothIcon });
	}

	return items;
}

function pageTitle(pathname: string): string {
	if (pathname === "/") return "単元一覧";
	if (pathname.startsWith("/settings")) return "設定";
	if (pathname.startsWith("/admin/tags")) return "単元・項目";
	if (pathname.startsWith("/admin/units/")) return "問題管理";
	if (pathname.startsWith("/admin")) return "管理";
	if (pathname.startsWith("/login")) return "ログイン";
	if (pathname.startsWith("/signup")) return "新規登録";
	if (pathname.startsWith("/units/")) return "単元";
	if (pathname.startsWith("/problems/")) return "問題";
	if (pathname.startsWith("/submissions/")) return "添削結果";
	return "やさしいみんなの数学";
}

function SidebarNav({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
	const { pathname } = useLocation();

	return (
		<nav className="relative flex flex-1 flex-col">
			<ul role="list" className="flex flex-1 flex-col gap-y-7">
				<li>
					<ul role="list" className="-mx-2 space-y-1">
						{items.map((item) => {
							const current = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
							return (
								<li key={item.name}>
									<NavLink
										to={item.to}
										onClick={onNavigate}
										className={classNames(
											current
												? "bg-stone-50 text-brand-700"
												: "text-stone-700 hover:bg-stone-50 hover:text-brand-700",
											"group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold",
										)}
									>
										<item.icon
											aria-hidden="true"
											className={classNames(
												current ? "text-brand-700" : "text-stone-400 group-hover:text-brand-700",
												"size-6 shrink-0",
											)}
										/>
										{item.name}
									</NavLink>
								</li>
							);
						})}
					</ul>
				</li>
			</ul>
		</nav>
	);
}

function UserAvatar({
	user,
	className,
}: {
	user: { name?: string | null; email: string; image?: string | null };
	className?: string;
}) {
	if (user.image) {
		return <img src={user.image} alt="" className={classNames("shrink-0 rounded-full object-cover", className)} />;
	}
	return (
		<div
			className={classNames(
				"flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-800",
				className,
			)}
		>
			{user.name?.[0]?.toUpperCase() ?? user.email[0]?.toUpperCase() ?? "?"}
		</div>
	);
}

function UsageChip({ me }: { me: Me | null }) {
	if (!me?.usage) return null;
	const remaining = Math.max(me.usage.limit - me.usage.used, 0);
	return (
		<span
			className={classNames(
				"inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
				remaining > 0 ? "bg-brand-50 text-brand-700 ring-brand-200" : "bg-stone-100 text-stone-500 ring-stone-200",
			)}
		>
			本日の添削 あと{remaining}回
		</span>
	);
}

function SidebarBrand() {
	return (
		<div className="flex h-16 shrink-0 items-center">
			<Link to="/" className="font-bold text-lg tracking-wide text-brand-800">
				やさしいみんなの数学
			</Link>
		</div>
	);
}

function SidebarFooter({
	session,
	me,
	isPending,
	onSignOut,
	onNavigate,
}: {
	session: ReturnType<typeof useSession>["data"];
	me: Me | null;
	isPending: boolean;
	onSignOut: () => void;
	onNavigate?: () => void;
}) {
	if (isPending) return null;

	if (session?.user) {
		return (
			<div className="-mx-6 mt-auto">
				<Link to="/settings" onClick={onNavigate} className="flex items-center gap-x-3 px-6 py-3 hover:bg-stone-50">
					<UserAvatar user={session.user} className="size-8 text-sm" />
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm/6 font-semibold text-stone-900">{session.user.name ?? session.user.email}</p>
						<UsageChip me={me} />
					</div>
				</Link>
				<button
					type="button"
					onClick={() => {
						onNavigate?.();
						onSignOut();
					}}
					className="flex w-full items-center gap-x-3 px-6 py-3 text-sm/6 font-semibold text-stone-700 hover:bg-stone-50"
				>
					<ArrowRightOnRectangleIcon aria-hidden="true" className="size-6 shrink-0 text-stone-400" />
					ログアウト
				</button>
			</div>
		);
	}

	return (
		<div className="-mx-6 mt-auto">
			<NavLink
				to="/login"
				onClick={onNavigate}
				className="flex items-center gap-x-3 px-6 py-3 text-sm/6 font-semibold text-stone-700 hover:bg-stone-50"
			>
				<ArrowRightStartOnRectangleIcon aria-hidden="true" className="size-6 shrink-0 text-stone-400" />
				ログイン
			</NavLink>
			<NavLink
				to="/signup"
				onClick={onNavigate}
				className="flex items-center gap-x-3 px-6 py-3 text-sm/6 font-semibold text-brand-700 hover:bg-brand-50"
			>
				<UserPlusIcon aria-hidden="true" className="size-6 shrink-0 text-brand-600" />
				はじめる
			</NavLink>
		</div>
	);
}

function SidebarPanel({
	items,
	session,
	me,
	isPending,
	onSignOut,
	onNavigate,
}: {
	items: NavItem[];
	session: ReturnType<typeof useSession>["data"];
	me: Me | null;
	isPending: boolean;
	onSignOut: () => void;
	onNavigate?: () => void;
}) {
	return (
		<div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-stone-200 bg-white px-6">
			<SidebarBrand />
			<SidebarNav items={items} onNavigate={onNavigate} />
			<SidebarFooter session={session} me={me} isPending={isPending} onSignOut={onSignOut} onNavigate={onNavigate} />
		</div>
	);
}

export function Layout() {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const { data: session, isPending } = useSession();
	const { data: me, reload: reloadMe } = useFetch<Me>("/api/me");
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const navigation = useNavigation(session, me);

	// 添削依頼で残り回数が変わったらチップを更新する
	useEffect(() => {
		window.addEventListener("usage-changed", reloadMe);
		return () => window.removeEventListener("usage-changed", reloadMe);
	}, [reloadMe]);

	async function handleSignOut() {
		await signOut();
		navigate("/");
	}

	return (
		<div>
			<Dialog open={sidebarOpen} onClose={setSidebarOpen} className="relative z-50 lg:hidden">
				<DialogBackdrop
					transition
					className="fixed inset-0 bg-stone-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
				/>

				<div className="fixed inset-0 flex">
					<DialogPanel
						transition
						className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
					>
						<TransitionChild>
							<div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
								<button type="button" onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5">
									<span className="sr-only">メニューを閉じる</span>
									<XMarkIcon aria-hidden="true" className="size-6 text-white" />
								</button>
							</div>
						</TransitionChild>

						<div className="relative flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2">
							<SidebarBrand />
							<SidebarNav items={navigation} onNavigate={() => setSidebarOpen(false)} />
							<SidebarFooter
								session={session}
								me={me}
								isPending={isPending}
								onSignOut={handleSignOut}
								onNavigate={() => setSidebarOpen(false)}
							/>
						</div>
					</DialogPanel>
				</div>
			</Dialog>

			<div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
				<SidebarPanel
					items={navigation}
					session={session}
					me={me}
					isPending={isPending}
					onSignOut={handleSignOut}
				/>
			</div>

			<div className="sticky top-0 z-40 flex items-center gap-x-6 border-b border-stone-200 bg-white px-4 py-4 shadow-xs sm:px-6 lg:hidden">
				<button
					type="button"
					onClick={() => setSidebarOpen(true)}
					className="-m-2.5 p-2.5 text-stone-700 hover:text-stone-900"
				>
					<span className="sr-only">メニューを開く</span>
					<Bars3Icon aria-hidden="true" className="size-6" />
				</button>
				<div className="flex-1 text-sm/6 font-semibold text-stone-900">{pageTitle(pathname)}</div>
				{session?.user ? (
					<Link to="/settings">
						<UserAvatar user={session.user} className="size-8 text-sm" />
					</Link>
				) : (
					!isPending && (
						<Link to="/login" className="text-sm font-semibold text-brand-700">
							ログイン
						</Link>
					)
				)}
			</div>

			<main className="flex min-h-dvh flex-col bg-stone-50 py-10 lg:pl-72">
				<div className="flex w-full min-h-0 flex-1 flex-col px-4 sm:px-6 lg:px-8">
					<Outlet />
				</div>
				<footer className="mt-auto shrink-0 py-6 text-center text-xs text-stone-500">
					<p>
						問題・解説は{" "}
						<a
							href="https://creativecommons.org/licenses/by-sa/4.0/deed.ja"
							target="_blank"
							rel="noreferrer"
							className="underline"
						>
							CC BY-SA 4.0
						</a>{" "}
						で公開しています
					</p>
				</footer>
			</main>
		</div>
	);
}
