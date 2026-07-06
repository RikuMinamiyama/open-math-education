import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "./db/client";
import * as schema from "./db/schema";

// リクエストごとに生成する（Workersはグローバル状態を持てないため）
export function createAuth(env: Env, baseURL: string) {
	return betterAuth({
		baseURL,
		secret: env.AUTH_SECRET,
		database: drizzleAdapter(getDb(env), {
			provider: "sqlite",
			schema: {
				user: schema.users,
				session: schema.sessions,
				account: schema.accounts,
				verification: schema.verifications,
			},
		}),
		emailAndPassword: {
			enabled: true,
		},
		user: {
			additionalFields: {
				role: { type: "string", defaultValue: "student", input: false },
				researchOptIn: { type: "boolean", defaultValue: false, input: false },
			},
		},
	});
}

export type Auth = ReturnType<typeof createAuth>;
export type SessionUser = NonNullable<Awaited<ReturnType<Auth["api"]["getSession"]>>>["user"];
