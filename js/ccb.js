
/* ccb.js — 查分相关前端逻辑（卡片式管理入口 + 子页）
 * 变更要点：
 * 1) 管理首页改为卡片式入口（“查分服务器设置 / 查分游戏设置”）
 * 2) 新增子页：site-admin-ccb-servers / site-admin-ccb-games
 * 3) 服务器新增/列表不再涉及 game_title（由 ccb_game 专管）
 * 4) 列表加载前统一清空，避免重复条目
 * 5) 防止重复绑定：每次渲染页面都整体重绘，再绑定事件
 */

(function(){
  function showErrorMessage(msg) { window?.toast?.error ? toast.error(msg) : alert(msg); }
  function showSuccessMessage(msg) { window?.toast?.success ? toast.success(msg) : alert(msg); }
  function showLoginRequired(pageId) {
    const c = document.getElementById('content-container');
    if (c) c.innerHTML = `<div class="section"><p>请先登录再访问此页面</p></div>`;
  }
  function secureFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = Object.assign({}, options.headers || {});
    if (token && !headers['Authorization']) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, { ...options, headers })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw data || { error: '请求失败' };
        return data;
      });
  }

  // 在用户设置页中展示查分绑定信息（保持原有行为）
  function displayCCBInfoInSettings() {
    const settingsContainer = document.getElementById('settings-extra');
    if (!settingsContainer) return;

    const bound = (window.currentUser && window.currentUser.keychip && window.currentUser.guid);
    const ccbInfoSection = document.createElement('div');
    ccbInfoSection.className = 'card';
    ccbInfoSection.innerHTML = `
      <h3>查分绑定</h3>
      ${bound ? `
        <div>
          <p><strong>查分服务器:</strong> ${window.currentUser.game_server || '-'}</p>
          <p><strong>keychip:</strong> ${window.currentUser.keychip}</p>
          <p><strong>游戏卡号:</strong> ${window.currentUser.guid}</p>
          <button type="button" class="ccb-btn ccb-btn-secondary" id="settings-unbind-btn">解绑查分信息</button>
        </div>
      ` : '<p>未绑定查分信息</p>'}
    `;
    settingsContainer.appendChild(ccbInfoSection);

    const unbindBtn = document.getElementById('settings-unbind-btn');
    if (unbindBtn) unbindBtn.addEventListener('click', handleUnbind);
  }

  function handleUnbind() {
    secureFetch('https://api.am-all.com.cn/api/ccb/unbind', { method: 'POST' })
      .then(() => {
        showSuccessMessage('解绑成功');
        window.loadPage && window.loadPage('user-settings');
      })
      .catch((e) => {
        console.error(e);
        showErrorMessage('解绑失败');
      });
  }

  // --- 管理首页：卡片式入口 ---
  function ensureAdminStyles(){
    if (document.getElementById('admin-card-styles')) return;
    const style = document.createElement('style');
    style.id = 'admin-card-styles';
    style.textContent = `
      .admin-card-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 16px;
        margin-top: 12px;
      }
      .admin-card {
        border: 1px solid rgba(0,0,0,0.1);
        border-radius: 10px;
        padding: 16px;
        background: #fff;
        box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      }
      .admin-card.clickable { cursor: pointer; }
      .admin-card h3 { margin: 0 0 8px; font-size: 16px; }
      .admin-card p { margin: 0 0 12px; color: #666; font-size: 13px; }
      .card-actions { display: flex; gap: 8px; }
      .ccb-btn { padding: 6px 12px; border: 1px solid #ddd; border-radius: 6px; background:#f7f7f7; }
      .ccb-btn-primary { background: #3b82f6; color: #fff; border-color: #3b82f6; }
      .ccb-btn-secondary { background: #f3f4f6; color: #111; border-color: #e5e7eb; }
      .admin-container { margin-top: 12px; }
      .admin-form .form-group { margin-bottom: 10px; }
      .admin-list { margin-top: 16px; }
      .admin-item { display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom: 1px dashed #eee; }
    `;
    document.head.appendChild(style);
  }

  function renderSiteAdminHome() {
    ensureAdminStyles();
    const c = document.getElementById('content-container');
    if (!c) return;
    c.innerHTML = `
      <div class="section">
        <h1 class="page-title">网站管理</h1>
        <div class="admin-card-grid">
          <div class="admin-card clickable" id="card-ccb-servers">
            <h3>查分服务器设置</h3>
            <p>管理查分服务器地址与名称。</p>
            <div class="card-actions"><button class="ccb-btn ccb-btn-primary">进入</button></div>
          </div>
          <div class="admin-card clickable" id="card-ccb-games">
            <h3>查分游戏设置</h3>
            <p>管理可查询的游戏与代码。</p>
            <div class="card-actions"><button class="ccb-btn ccb-btn-primary">进入</button></div>
          </div>
        </div>
      </div>
    `;
    document.getElementById('card-ccb-servers')?.addEventListener('click', () => window.loadPage('site-admin-ccb-servers'));
    document.getElementById('card-ccb-games')?.addEventListener('click', () => window.loadPage('site-admin-ccb-games'));
  }

  // --- 子页：查分服务器 ---（不再需要 game_title）
  function renderCCBServersPage() {
    ensureAdminStyles();
    const c = document.getElementById('content-container');
    if (!c) return;
    c.innerHTML = `
      <div class="section">
        <h1 class="page-title">查分服务器设置</h1>
        <div class="admin-container">
          <div class="admin-card">
            <h3>新增服务器</h3>
            <form id="server-form" class="admin-form">
              <div class="form-group">
                <label for="server-name">服务器名称</label>
                <input type="text" id="server-name" required>
              </div>
              <div class="form-group">
                <label for="server-url">服务器地址</label>
                <input type="text" id="server-url" required>
              </div>
              <button type="submit" class="ccb-btn ccb-btn-primary">添加服务器</button>
              <button type="button" id="btn-back-admin" class="ccb-btn ccb-btn-secondary" style="margin-left:8px;">返回管理首页</button>
            </form>

            <div class="admin-list" id="server-list">
              <h4>服务器列表</h4>
            </div>
          </div>
        </div>
      </div>
    `;
    document.getElementById('server-form').addEventListener('submit', handleServerAdd_NoGameTitle);
    document.getElementById('btn-back-admin')?.addEventListener('click', () => window.loadPage('site-admin'));
    loadAdminServerList_Clean();
  }

  function loadAdminServerList_Clean() {
    secureFetch('https://api.am-all.com.cn/api/ccb/servers')
      .then((servers) => {
        const list = document.getElementById('server-list');
        if (!list) return;
        // 防重复：每次加载先清空成标题
        list.innerHTML = '<h4>服务器列表</h4>';

        if (!servers || servers.length === 0) {
          list.innerHTML += '<p>暂无服务器</p>';
          return;
        }

        servers.forEach((server) => {
          const item = document.createElement('div');
          item.className = 'admin-item';
          item.innerHTML = `
            <div>
              <strong>${server.server_name}</strong> - ${server.server_url}
            </div>
            <div class="admin-item-actions">
              <button class="ccb-btn ccb-btn-secondary" data-id="${server.id}">删除</button>
            </div>
          `;
          item.querySelector('button[data-id]').addEventListener('click', () => deleteServer(server.id));
          list.appendChild(item);
        });
      })
      .catch((err) => {
        console.error('加载服务器列表失败:', err);
        showErrorMessage('加载服务器列表失败');
      });
  }

  function handleServerAdd_NoGameTitle(e) {
    e.preventDefault();
    const name = document.getElementById('server-name').value.trim();
    const url  = document.getElementById('server-url').value.trim();
    if (!name || !url) return showErrorMessage('请填写所有字段');

    secureFetch('https://api.am-all.com.cn/api/admin/ccb/servers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ server_name: name, server_url: url })
    })
    .then((ret) => {
      if (ret && ret.success) {
        showSuccessMessage('服务器添加成功');
        document.getElementById('server-form').reset();
        loadAdminServerList_Clean();
      } else {
        showErrorMessage(ret.error || '添加服务器失败');
      }
    })
    .catch((err) => {
      console.error('添加服务器失败:', err);
      showErrorMessage('添加服务器失败');
    });
  }

  function deleteServer(id) {
    if (!confirm('确定要删除这个服务器吗？')) return;
    secureFetch(`https://api.am-all.com.cn/api/admin/ccb/servers/${id}`, { method: 'DELETE' })
    .then((ret) => {
      if (ret && ret.success) {
        showSuccessMessage('服务器删除成功');
        loadAdminServerList_Clean();
      } else {
        showErrorMessage(ret.error || '删除服务器失败');
      }
    })
    .catch((err) => {
      console.error('删除服务器失败:', err);
      showErrorMessage('删除服务器失败');
    });
  }

  // --- 子页：查分游戏 ---（保留 game_title 在 ccb_game）
  function renderCCBGamesPage() {
    ensureAdminStyles();
    const c = document.getElementById('content-container');
    if (!c) return;

    c.innerHTML = `
      <div class="section">
        <h1 class="page-title">查分游戏设置</h1>
        <div class="admin-container">
          <div class="admin-card">
            <h3>新增游戏</h3>
            <form id="game-form" class="admin-form">
              <div class="form-group">
                <label for="game-name">游戏名称</label>
                <input type="text" id="game-name" required>
              </div>
              <div class="form-group">
                <label for="game-title">游戏代码</label>
                <input type="text" id="game-title" required>
              </div>
              <button type="submit" class="ccb-btn ccb-btn-primary">添加游戏</button>
              <button type="button" id="btn-back-admin2" class="ccb-btn ccb-btn-secondary" style="margin-left:8px;">返回管理首页</button>
            </form>

            <div class="admin-list" id="game-list">
              <h4>游戏列表</h4>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('game-form').addEventListener('submit', handleGameAdd);
    document.getElementById('btn-back-admin2')?.addEventListener('click', () => window.loadPage('site-admin'));
    loadAdminGameList_Clean();
  }

  function loadAdminGameList_Clean() {
    secureFetch('https://api.am-all.com.cn/api/ccb/games')
      .then((games) => {
        const list = document.getElementById('game-list');
        if (!list) return;

        // 防重复：每次加载先清空成标题
        list.innerHTML = '<h4>游戏列表</h4>';

        if (!games || games.length === 0) {
          list.innerHTML += '<p>暂无游戏</p>';
          return;
        }

        games.forEach((game) => {
          const item = document.createElement('div');
          item.className = 'admin-item';
          item.innerHTML = `
            <div>
              <strong>${game.game_name}</strong> (${game.game_title})
            </div>
            <div class="admin-item-actions">
              <button class="ccb-btn ccb-btn-secondary" data-id="${game.id}">删除</button>
            </div>
          `;
          item.querySelector('button[data-id]').addEventListener('click', () => deleteGame(game.id));
          list.appendChild(item);
        });
      })
      .catch((err) => {
        console.error('加载游戏列表失败:', err);
        showErrorMessage('加载游戏列表失败');
      });
  }

  function handleGameAdd(e) {
    e.preventDefault();
    const name  = document.getElementById('game-name').value.trim();
    const title = document.getElementById('game-title').value.trim();
    if (!name || !title) return showErrorMessage('请填写所有字段');

    secureFetch('https://api.am-all.com.cn/api/admin/ccb/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game_name: name, game_title: title })
    })
    .then((ret) => {
      if (ret && ret.success) {
        showSuccessMessage('游戏添加成功');
        document.getElementById('game-form').reset();
        loadAdminGameList_Clean();
      } else {
        showErrorMessage(ret.error || '添加游戏失败');
      }
    })
    .catch((err) => {
      console.error('添加游戏失败:', err);
      showErrorMessage('添加游戏失败');
    });
  }

  function deleteGame(id) {
    if (!confirm('确定要删除这个游戏吗？')) return;
    secureFetch(`https://api.am-all.com.cn/api/admin/ccb/games/${id}`, { method: 'DELETE' })
    .then((ret) => {
      if (ret && ret.success) {
        showSuccessMessage('游戏删除成功');
        loadAdminGameList_Clean();
      } else {
        showErrorMessage(ret.error || '删除游戏失败');
      }
    })
    .catch((err) => {
      console.error('删除游戏失败:', err);
      showErrorMessage('删除游戏失败');
    });
  }

  // --- 接入 SPA 路由 ---
  document.addEventListener('DOMContentLoaded', function () {
    if (!window.loadPage) return;
    const originalLoadPage = window.loadPage;

    window.loadPage = function (pageId) {
      if (pageId === 'site-admin' || pageId === 'site-admin-ccb-servers' || pageId === 'site-admin-ccb-games') {
        const token = localStorage.getItem('token');
        if (!token) return showLoginRequired(pageId);
        if (!window.currentUser || window.currentUser.user_rank < 5) {
          showErrorMessage('需要管理员权限才能访问此页面');
          return originalLoadPage('home');
        }
      }

      if (pageId === 'site-admin') return renderSiteAdminHome();
      if (pageId === 'site-admin-ccb-servers') return renderCCBServersPage();
      if (pageId === 'site-admin-ccb-games') return renderCCBGamesPage();

      return originalLoadPage(pageId);
    };
  });

  // 可选：如果你的用户设置页需要注入查分信息
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    displayCCBInfoInSettings();
  } else {
    document.addEventListener('DOMContentLoaded', displayCCBInfoInSettings);
  }
})();


// === 渲染：用户查分（绑定/解绑） ===
function renderCCBUserPage() {
  var c = document.getElementById('content-container') || document.body;
  if (!c) return;
  c.innerHTML = [
    '<div class="section">',
      '<h1 class="page-title">游戏查分</h1>',
      '<div class="admin-container">',
        '<div class="admin-card">',
          '<h3>绑定查分信息</h3>',
          '<form id="ccb-bind-form" class="admin-form">',
            '<div class="form-group">',
              '<label for="ccb-server">查分服务器</label>',
              '<select id="ccb-server" required></select>',
            '</div>',
            '<div class="form-group">',
              '<label for="ccb-keychip">keychip</label>',
              '<input type="text" id="ccb-keychip" required />',
            '</div>',
            '<div class="form-group">',
              '<label for="ccb-guid">游戏卡号</label>',
              '<input type="text" id="ccb-guid" required />',
            '</div>',
            '<div style="display:flex;gap:8px;flex-wrap:wrap;">',
              '<button type="submit" class="ccb-btn ccb-btn-primary">保存绑定</button>',
              '<button type="button" id="ccb-unbind-btn" class="ccb-btn ccb-btn-secondary">解绑</button>',
            '</div>',
          '</form>',
        '</div>',
      '</div>',
    '</div>'
  ].join('');

  var base = (window.API_BASE_URL || 'https://api.am-all.com.cn');
  try {
    fetch(base + '/api/ccb/servers').then(function(r){ return r.json(); }).then(function(list){
      var sel = document.getElementById('ccb-server');
      if (!sel) return;
      sel.innerHTML = (list || []).map(function(s){
        return '<option value="' + (s.server_name || '') + '">' + (s.server_name || '') + (s.server_url ? (' - ' + s.server_url) : '') + '</option>';
      }).join('');
      try {
        var me = JSON.parse(localStorage.getItem('userInfo') || '{}');
        if (me && me.game_server && sel.querySelector('option[value="' + me.game_server + '"]')) sel.value = me.game_server;
        if (me && me.keychip) document.getElementById('ccb-keychip').value = me.keychip || '';
        if (me && me.guid) document.getElementById('ccb-guid').value = me.guid || '';
      } catch(_e){}
    }).catch(function(e){ console.warn('加载服务器列表失败', e); });
  } catch(_ignore) {}

  var form = document.getElementById('ccb-bind-form');
  if (form) {
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var token = localStorage.getItem('token');
      if (!token) { if (typeof showLoginRequired==='function') return showLoginRequired('ccb'); alert('未登录'); return; }
      var payload = {
        game_server: (document.getElementById('ccb-server').value || '').trim(),
        keychip: (document.getElementById('ccb-keychip').value || '').trim(),
        guid: (document.getElementById('ccb-guid').value || '').trim()
      };
      fetch(base + '/api/ccb/bind', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(async function(r){
        if (!r.ok) throw new Error(await r.text() || '绑定失败');
        if (typeof showSuccessMessage === 'function') showSuccessMessage('绑定成功');
        try {
          var me = JSON.parse(localStorage.getItem('userInfo') || '{}');
          var merged = Object.assign({}, me || {}, payload);
          localStorage.setItem('userInfo', JSON.stringify(merged));
          window.currentUser = merged;
        } catch(_e){}
      }).catch(function(err){
        console.error('绑定失败:', err);
        if (typeof showErrorMessage === 'function') showErrorMessage(err.message || '绑定失败');
      });
    });
  }

  var unbindBtn = document.getElementById('ccb-unbind-btn');
  if (unbindBtn) {
    unbindBtn.addEventListener('click', function(){
      var token = localStorage.getItem('token');
      if (!token) { if (typeof showLoginRequired==='function') return showLoginRequired('ccb'); alert('未登录'); return; }
      if (!confirm('确定要解绑查分信息吗？')) return;
      fetch(base + '/api/ccb/unbind', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token } })
        .then(async function(r){
          if (!r.ok) throw new Error(await r.text() || '解绑失败');
          if (typeof showSuccessMessage === 'function') showSuccessMessage('解绑成功');
          try {
            var me = JSON.parse(localStorage.getItem('userInfo') || '{}');
            var merged = Object.assign({}, me || {}, { game_server: '', keychip: '', guid: '' });
            localStorage.setItem('userInfo', JSON.stringify(merged));
            window.currentUser = merged;
            var k = document.getElementById('ccb-keychip'); if (k) k.value = '';
            var g = document.getElementById('ccb-guid'); if (g) g.value = '';
          } catch(_e){}
        }).catch(function(err){
          console.error('解绑失败:', err);
          if (typeof showErrorMessage === 'function') showErrorMessage(err.message || '解绑失败');
        });
    });
  }
}

// === 导出到全局（供路由层调用） ===
window.renderCCBUserPage = (typeof renderCCBUserPage === 'function') ? renderCCBUserPage : window.renderCCBUserPage;
window.renderSiteAdminHome = (typeof renderSiteAdminHome === 'function') ? renderSiteAdminHome : window.renderSiteAdminHome;
window.renderCCBServersPage = (typeof renderCCBServersPage === 'function') ? renderCCBServersPage : window.renderCCBServersPage;
window.renderCCBGamesPage = (typeof renderCCBGamesPage === 'function') ? renderCCBGamesPage : window.renderCCBGamesPage;
