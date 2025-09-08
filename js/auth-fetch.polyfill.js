
// === auth-fetch.polyfill.v3.js (2025-09-08) ===
// 1) Inject Bearer token from localStorage/sessionStorage automatically
// 2) Add cache-busting for permission endpoints (query-only, no Cache-Control header)
// 3) Auto-capture token from JSON responses that contain a top-level "token"
// 4) Include credentials by default
(function(){
  if (typeof window === 'undefined' || window.__authFetchInstalledV3) return;
  const ORIG_FETCH = window.fetch;

  function getToken(){
    try {
      const a = localStorage.getItem('token') || sessionStorage.getItem('token');
      return a && typeof a === 'string' ? a : null;
    } catch(_){ return null; }
  }
  function setToken(t){
    try { if (t) localStorage.setItem('token', t); } catch(_){}
  }
  function setUserInfo(u){
    try { if (u) localStorage.setItem('userInfo', JSON.stringify(u)); } catch(_){}
  }
  function getURL(input){
    if (typeof input === 'string') return input;
    if (input && input.url) return input.url;
    try { return String(input); } catch(_){ return ''; }
  }

  window.fetch = function(input, init){
    init = init || {};
    init.headers = init.headers || {};
    const h = new Headers(init.headers);

    // Attach Authorization
    const t = getToken();
    if (t && !h.has('Authorization')) h.set('Authorization', 'Bearer ' + t);

    // Permissions endpoints: append timestamp
    let url = getURL(input);
    if (url.includes('/api/check-permission') || url.includes('/api/page-visibility')) {
      try { const u = new URL(url, location.origin); u.searchParams.set('_t', Date.now().toString()); url = u.toString(); input = url; } catch(_){}
    }

    if (!('credentials' in init)) init.credentials = 'include';
    init.headers = h;

    return ORIG_FETCH(input, init).then(async (res) => {
      // Opportunistically capture token from JSON body
      try {
        const ct = res.headers.get('content-type')||'';
        if (ct.includes('application/json')) {
          const clone = res.clone();
          const data = await clone.json().catch(()=>null);
          if (data && typeof data === 'object') {
            if (typeof data.token === 'string' && data.token.length > 16) {
              setToken(data.token);
              try { window.dispatchEvent(new CustomEvent('token:updated', { detail: data.token })); } catch(_){}
            }
            const userObj = data.user || data.userInfo || data.profile || null;
            if (userObj) setUserInfo(userObj);
          }
        }
      } catch(_){}
      return res;
    });
  };

  window.__authFetchInstalledV3 = true;
  console.log('[auth-fetch] v3 installed');
})();
