// =============================
// /app/api/_utils.ts
// =============================

export function normalizeRule(text: string) {
return text.trim().replace(/\s+/g, ' ');
}

export function badRequest(msg: string) {
return Response.json({ error: msg }, { status: 400 });
}

export function conflict(msg: string) {
return Response.json({ error: msg }, { status: 409 });
}

export function unauthorized() {
return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
