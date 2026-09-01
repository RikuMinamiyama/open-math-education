export class NonRetryableGradingError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "NonRetryableGradingError";
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

export function getErrorStatus(err: unknown): number | undefined {
	if (isRecord(err) && typeof err.status === "number") return err.status;
	return undefined;
}

function nestedErrorBody(err: unknown): Record<string, unknown> | undefined {
	if (!isRecord(err)) return undefined;
	if (isRecord(err.error) && isRecord(err.error.error)) return err.error.error;
	if (isRecord(err.error)) return err.error;
	return undefined;
}

export function formatGradingError(err: unknown): string {
	if (err instanceof NonRetryableGradingError) return err.message;
	if (typeof err === "object" && err !== null) {
		const status = getErrorStatus(err);
		const rec = err as { type?: unknown; message?: unknown };
		const body = nestedErrorBody(err);
		const type =
			(typeof rec.type === "string" && rec.type !== "error" ? rec.type : undefined) ||
			(typeof body?.type === "string" ? body.type : undefined);
		const message =
			(typeof body?.message === "string" ? body.message : undefined) ||
			(typeof rec.message === "string" ? rec.message : undefined) ||
			String(err);
		return [status != null ? `anthropic ${status}` : "anthropic error", type, message].filter(Boolean).join(": ");
	}
	return String(err);
}

export function isModelAccessError(err: unknown): boolean {
	const status = getErrorStatus(err);
	if (status === 403 || status === 404) return true;
	const text = formatGradingError(err).toLowerCase();
	return (
		text.includes("permission_error") ||
		text.includes("not_found_error") ||
		text.includes("you do not have access to model") ||
		text.includes("model not found")
	);
}

export function isRetryableError(err: unknown): boolean {
	if (err instanceof NonRetryableGradingError) return false;
	const status = getErrorStatus(err);
	if (status === 429 || status === 529 || (status !== undefined && status >= 500)) return true;
	if (status !== undefined) return false;
	const text = formatGradingError(err).toLowerCase();
	return text.includes("connection") || text.includes("timeout") || text.includes("overloaded");
}
