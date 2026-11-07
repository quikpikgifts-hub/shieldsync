export function authorized(req) {
  const expected = process.env.QP_AGENT_BRIDGE_TOKEN;
  if (!expected || expected.length < 32) return false;
  const supplied = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!supplied || supplied.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ supplied.charCodeAt(i);
  return diff === 0;
}
export function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}
export async function body(req) {
  const type = req.headers.get("content-type") || "";
  if (!type.includes("application/json")) throw new Error("Content-Type must be application/json");
  const raw = await req.text();
  if (raw.length > 12000) throw new Error("Request body too large");
  return JSON.parse(raw);
}
