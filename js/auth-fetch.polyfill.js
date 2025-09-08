
// === auth-fetch.polyfill.v2.js (2025-09-08) ===
// Global fetch wrapper: inject Bearer token, add cache-busting for permission endpoints, include credentials.
// NOTE: We purposely DO NOT set any request "Cache-Control" header to avoid CORS preflight issues.
(function(){
  if (typeof window === 'undefined' || window.__authFetchInstalledV2) return;
  const ORIG_FETCH = window.fetch;
  function getToken(){
    try { return JSON.parse(localStorage.getItem('token')||'null') || localStorage.getItem('token'); } catch(_){ return localStorage.getItem('token'); }
  }
  window.fetch = function(input, init){
    init = init || {};
    init.headers = init.headers || {};
    const h = new Headers(init.headers);
    const t = getToken();
    if (t && !h.has('Authorization')) h.set('Authorization', 'Bearer ' + t);
    // add cache-busting only for permission endpoints
    let url = (typeof input === 'string') ? input : (input && input.url) ? input.url : '';
    if (url.includes('/api/check-permission') || url.includes('/api/page-visibility')) {
      try {
        const u = new URL(url, location.origin);
        u.searchParams.set('_t', Date.now().toString());
        url = u.toString();
        input = url;
      } catch(_){}
    }
    if (!('credentials' in init)) init.credentials = 'include';
    init.headers = h;
    return ORIG_FETCH(input, init);
  };
  window.__authFetchInstalledV2 = true;
  console.log('[auth-fetch] v2 installed');
})();
