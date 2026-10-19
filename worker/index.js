// Static site; this Worker only adds byte-range support for the demo video (iOS Safari will not play video without it).
export default {
  async fetch(request, env) {
    const res = await env.ASSETS.fetch(new Request(request.url, { method: 'GET', headers: { accept: request.headers.get('accept') || '*/*' } }));
    const range = request.headers.get('range'), m = range && /^bytes=(\d*)-(\d*)$/.exec(range);
    const headers = new Headers(res.headers); headers.set('accept-ranges', 'bytes'); headers.set('cache-control', 'public, max-age=3600');
    if (!res.ok || !m) return new Response(request.method === 'HEAD' ? null : res.body, { status: res.status, headers });
    const buf = await res.arrayBuffer(), size = buf.byteLength;
    let start = m[1] === '' ? Math.max(0, size - Number(m[2])) : Number(m[1]);
    let end = m[1] === '' || m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1);
    if (start >= size || start > end) return new Response(null, { status: 416, headers: { 'content-range': `bytes */${size}` } });
    headers.set('content-range', `bytes ${start}-${end}/${size}`); headers.set('content-length', String(end - start + 1));
    return new Response(request.method === 'HEAD' ? null : buf.slice(start, end + 1), { status: 206, headers });
  },
};
