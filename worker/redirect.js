// The site moved to hi-loopy.v-001.workers.dev; keep old links working.
export default { fetch(request) { const u = new URL(request.url); u.hostname = 'hi-loopy.v-001.workers.dev'; return Response.redirect(u.toString(), 301); } };
