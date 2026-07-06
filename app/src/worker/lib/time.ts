// JST基準の日付文字列 YYYY-MM-DD
// 学習の1日はJSTで区切る
export function jstDay(date = new Date()): string {
	const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
	return jst.toISOString().slice(0, 10);
}
