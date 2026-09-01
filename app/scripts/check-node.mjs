import module from "node:module";

if (typeof module.registerHooks !== "function") {
	console.error(
		`@cloudflare/vite-plugin は Node.js 22.15 以上が必要です（module.registerHooks）。今は ${process.version} です。\n` +
			"nvm install 22 && nvm use 22 のあと、もう一度 pnpm run deploy を実行してください。",
	);
	process.exit(1);
}
