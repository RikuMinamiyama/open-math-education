import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { isEditor, useFetch, type Me } from "../api";
import { signOut, useSession } from "../auth-client";

export function Layout() {
	const { data: session, isPending } = useSession();
	const { data: me } = useFetch<Me>("/api/me");
	const navigate = useNavigate();

	async function handleSignOut() {
		await signOut();
		navigate("/");
	}

	return (
		<div className="min-h-dvh flex flex-col">
			<header className="bg-teal-800 text-white shadow">
				<div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-3">
					<Link to="/" className="font-bold text-lg tracking-wide">
						やさしいみんなの数学
					</Link>
					<nav className="flex items-center gap-4 text-sm">
						{session?.user ? (
							<>
								{isEditor(me) && (
									<NavLink to="/admin" className="hover:underline">
										管理
									</NavLink>
								)}
								<NavLink to="/history" className="hover:underline">
									学習履歴
								</NavLink>
								<button type="button" onClick={handleSignOut} className="rounded bg-teal-700 px-3 py-1.5 hover:bg-teal-600">
									ログアウト
								</button>
							</>
						) : (
							!isPending && (
								<>
									<NavLink to="/login" className="hover:underline">
										ログイン
									</NavLink>
									<NavLink to="/signup" className="rounded bg-white/90 px-3 py-1.5 font-medium text-teal-800 hover:bg-white">
										はじめる
									</NavLink>
								</>
							)
						)}
					</nav>
				</div>
			</header>
			<main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
				<Outlet />
			</main>
			<footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-500">
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
		</div>
	);
}
