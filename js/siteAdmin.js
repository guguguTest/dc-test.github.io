// siteAdmin.js — 网站管理（独立）
// 依赖：currentUser / secureFetch / showLoginRequired / showErrorMessage / showSuccessMessage / loadPage

(function (global) {
  'use strict';

  // ---- 公共：管理员访问校验（与新路由合同兼容，避免误拦截）----
function ensureAdmin(pageId) {
  const token = localStorage.getItem('token');
  if (!token) { showLoginRequired(pageId || 'site-admin'); return false; }
  
  // 完全依赖路由层的权限检查
  if (global.__routeContractInstalledSafe) return true;
  
  // 移除协同管理员的硬编码检查，只保留基本的管理员检查作为回退
  const u = global.currentUser;
  if (!u || (u.user_rank || 0) < 5) {
    showErrorMessage('需要管理员权限才能访问此页面');
    loadPage('home');
    return false;
  }
  return true;
}

  function setContent(html) {
    const wrap = document.getElementById('content-container');
    if (!wrap) return null;
    wrap.innerHTML = html;
    return wrap;
  }

  function breadcrumb(paths) {
    const parts = paths.map((p,i) => {
      if (p.pageId)  return `<a href="#/${p.pageId}">${p.text}</a>`;
      if (p.onClick) return `<a href="#" data-bc-idx="${i}">${p.text}</a>`;
      return `<span>${p.text}</span>`;
    }).join(' / ');
    return `<div class="breadcrumb">${parts}</div>`;
  }

  // ---- 一级页：卡片式入口（靠左）----
  function renderSiteAdminHome() {
    if (!ensureAdmin('site-admin')) return;

    const html = `
      <div class="section">
        <h1 class="page-title">网站管理</h1>
        <div class="admin-container">
          ${breadcrumb([{text:'网站管理'}])}
          <div class="admin-entry-grid">
            <a class="admin-card admin-entry" id="entry-servers">
              <div class="admin-entry-title">查分服务器设置</div>
              <div class="admin-entry-desc">管理可供绑定的查分服务器（名称、地址）。</div>
              <div class="admin-actions"><button class="admin-btn admin-btn-ghost" type="button">进入</button></div>
            </a>
            <a class="admin-card admin-entry" id="entry-games">
              <div class="admin-entry-title">查分游戏设置</div>
              <div class="admin-entry-desc">维护可供查询的游戏列表（标题、显示名）。</div>
              <div class="admin-actions"><button class="admin-btn admin-btn-ghost" type="button">进入</button></div>
            </a>
			<a class="admin-card admin-entry" id="entry-tools">
			  <div class="admin-entry-title">实用工具管理</div>
			  <div class="admin-entry-desc">管理网站的实用工具，包括内部页面和下载链接。</div>
			  <div class="admin-actions"><button class="admin-btn admin-btn-ghost" type="button">进入</button></div>
			</a>
			<a class="admin-card admin-entry" id="entry-system-message">
			  <div class="admin-entry-title">系统消息管理</div>
			  <div class="admin-entry-desc">发送系统消息和管理自动消息模板。</div>
			  <div class="admin-actions"><button class="admin-btn admin-btn-ghost" type="button">进入</button></div>
			</a>
          </div>
        </div>
      </div>
    `;
    const root = setContent(html);
    if (!root) return;

    root.querySelector('#entry-servers').onclick = (e) => { e.preventDefault(); renderCCBServersPage(); };
    root.querySelector('#entry-games').onclick   = (e) => { e.preventDefault(); renderCCBGamesPage();  };
	root.querySelector('#entry-tools').onclick = (e) => { e.preventDefault(); if (typeof initToolsAdmin === 'function') {initToolsAdmin();}};
	root.querySelector('#entry-system-message').onclick = (e) => { e.preventDefault(); if (typeof renderSystemMessageAdmin === 'function') { renderSystemMessageAdmin(); } };
  }

  // ---- 二级页：查分服务器设置（读取公开端点；编辑=删除后新增）----
  function renderCCBServersPage() {
    if (!ensureAdmin('site-admin')) return;

    const html = `
      <div class="section">
        <h1 class="page-title">查分服务器设置</h1>
        <div class="admin-container centered">
          ${breadcrumb([{text:'网站管理', pageId:'site-admin'}, {text:'查分服务器设置'}])}
          <div class="admin-card admin-form-card">
            <form id="server-form" class="admin-form">
              <input type="hidden" id="server-id">
              <div class="form-group">
                <label for="server-name">服务器名称</label>
                <input type="text" id="server-name" required>
              </div>
              <div class="form-group">
                <label for="server-url">服务器地址</label>
                <input type="text" id="server-url" required>
              </div>
              <!-- 已删除“游戏代码”字段 -->
              <div class="admin-actions">
                <button type="submit" class="admin-btn admin-btn-primary">保存</button>
                <button type="button" id="server-reset" class="admin-btn admin-btn-ghost">清空</button>
                <button type="button" id="back-home-1" class="admin-btn admin-btn-ghost">返回网站管理</button>
              </div>
            </form>

            <div class="admin-list">
              <h4>服务器列表</h4>
              <div id="server-list"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    const root = setContent(html);
    if (!root) return;

    const form     = root.querySelector('#server-form');
    const resetBtn = root.querySelector('#server-reset');
    const backBtn  = root.querySelector('#back-home-1');
    const listWrap = root.querySelector('#server-list');

    form.onsubmit = async function(e){
      e.preventDefault();
      const token = localStorage.getItem('token');
      if (!token) { showLoginRequired('site-admin'); return; }

      const id   = root.querySelector('#server-id').value.trim();
      const name = root.querySelector('#server-name').value.trim();
      const url  = root.querySelector('#server-url').value.trim();
      if (!name || !url) { showErrorMessage('请填写完整信息'); return; }

      try {
        // 后端无 PUT，编辑=先删后增；新增=直接 POST
        if (id) {
          const delRes = await secureFetch(`https://api.am-all.com.cn/api/admin/ccb/servers/${encodeURIComponent(id)}`, {
            method:'DELETE', headers:{ 'Authorization':`Bearer ${token}` }
          });
          if (!delRes || delRes.success !== true) throw new Error(delRes?.error || '删除失败');
        }

        const postRes = await secureFetch(`https://api.am-all.com.cn/api/admin/ccb/servers`, {
          method:'POST',
          headers:{ 'Authorization':`Bearer ${token}`, 'Content-Type':'application/json' },
          body: JSON.stringify({ server_name: name, server_url: url })
        });
        if (postRes && postRes.success) {
          showSuccessMessage(id ? '已保存修改' : '添加成功');
          form.reset();
          root.querySelector('#server-id').value = '';
          await loadServers(listWrap);
        } else {
          throw new Error(postRes?.error || '保存失败');
        }
      } catch (err) {
        console.error(err); showErrorMessage(err.message || '请求失败');
      }
    };

    resetBtn.onclick = () => { form.reset(); root.querySelector('#server-id').value = ''; };
    backBtn.onclick  = ()   => { renderSiteAdminHome(); };

    loadServers(listWrap);
  }

  async function loadServers(listWrap) {
    try {
      const servers = await secureFetch('https://api.am-all.com.cn/api/ccb/servers'); // 公开读取
      listWrap.innerHTML = '';
      if (!Array.isArray(servers) || servers.length === 0) {
        listWrap.innerHTML = '<p class="empty">暂无服务器</p>';
        return;
      }

      listWrap.innerHTML = servers.map(s => `
        <div class="admin-item">
          <div class="admin-item-meta">
            <div><b>${s.server_name}</b></div>
            <div>${s.server_url}</div>
          </div>
          <div class="admin-item-actions">
            <button class="admin-btn admin-btn-primary" data-edit="${s.id}">编辑</button>
            <button class="admin-btn admin-btn-danger" data-del="${s.id}">删除</button>
          </div>
        </div>
      `).join('');

      // 事件委托（避免重复绑定）
      listWrap.onclick = async (e) => {
        const editId = e.target.getAttribute('data-edit');
        const delId  = e.target.getAttribute('data-del');

        if (editId) {
          const s = servers.find(x => String(x.id) === String(editId));
          if (!s) return;
          document.getElementById('server-id').value   = s.id;
          document.getElementById('server-name').value = s.server_name || '';
          document.getElementById('server-url').value  = s.server_url  || '';
          document.getElementById('server-form').scrollIntoView({behavior:'smooth', block:'start'});
        }

        if (delId) {
          const token = localStorage.getItem('token');
          if (!token) { showLoginRequired('site-admin'); return; }
          if (!confirm('确认删除该服务器？')) return;

          try {
            const res = await secureFetch(`https://api.am-all.com.cn/api/admin/ccb/servers/${encodeURIComponent(delId)}`, {
              method:'DELETE', headers:{ 'Authorization':`Bearer ${token}` }
            });
            if (res && res.success) {
              showSuccessMessage('删除成功');
              await loadServers(listWrap);
            } else {
              throw new Error(res?.error || '删除失败');
            }
          } catch (err) {
            console.error(err); showErrorMessage(err.message || '请求失败');
          }
        }
      };
    } catch (err) {
      console.error(err);
      showErrorMessage('加载服务器列表失败');
    }
  }

  // ---- 二级页：查分游戏设置（读取公开端点；编辑=删除后新增）----
  function renderCCBGamesPage() {
    if (!ensureAdmin('site-admin')) return;

    const html = `
      <div class="section">
        <h1 class="page-title">查分游戏设置</h1>
        <div class="admin-container centered">
          ${breadcrumb([{text:'网站管理', pageId:'site-admin'}, {text:'查分游戏设置'}])}
          <div class="admin-card admin-form-card">
            <form id="game-form" class="admin-form">
              <input type="hidden" id="game-id">
              <div class="form-group">
                <label for="game-title">游戏代码（用于后端识别）</label>
                <input type="text" id="game-title" required>
              </div>
              <div class="form-group">
                <label for="game-name">游戏名称（给用户看的显示名）</label>
                <input type="text" id="game-name" required>
              </div>
              <div class="admin-actions">
                <button type="submit" class="admin-btn admin-btn-primary">保存</button>
                <button type="button" id="game-reset" class="admin-btn admin-btn-ghost">清空</button>
                <button type="button" id="back-home-2" class="admin-btn admin-btn-ghost">返回网站管理</button>
              </div>
            </form>

            <div class="admin-list">
              <h4>游戏列表</h4>
              <div id="game-list"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    const root = setContent(html);
    if (!root) return;

    const form     = root.querySelector('#game-form');
    const resetBtn = root.querySelector('#game-reset');
    const backBtn  = root.querySelector('#back-home-2');
    const listWrap = root.querySelector('#game-list');

    form.onsubmit = async function(e){
      e.preventDefault();
      const token = localStorage.getItem('token');
      if (!token) { showLoginRequired('site-admin'); return; }

      const id    = root.querySelector('#game-id').value.trim();
      const title = root.querySelector('#game-title').value.trim();
      const name  = root.querySelector('#game-name').value.trim();
      if (!title || !name) { showErrorMessage('请填写完整信息'); return; }

      try {
        if (id) {
          const delRes = await secureFetch(`https://api.am-all.com.cn/api/admin/ccb/games/${encodeURIComponent(id)}`, {
            method:'DELETE', headers:{ 'Authorization':`Bearer ${token}` }
          });
          if (!delRes || delRes.success !== true) throw new Error(delRes?.error || '删除失败');
        }

        const postRes = await secureFetch(`https://api.am-all.com.cn/api/admin/ccb/games`, {
          method:'POST',
          headers:{ 'Authorization':`Bearer ${token}`, 'Content-Type':'application/json' },
          body: JSON.stringify({ game_title: title, game_name: name })
        });
        if (postRes && postRes.success) {
          showSuccessMessage(id ? '已保存修改' : '添加成功');
          form.reset();
          root.querySelector('#game-id').value = '';
          await loadGames(listWrap);
        } else {
          throw new Error(postRes?.error || '保存失败');
        }
      } catch (err) {
        console.error(err); showErrorMessage(err.message || '请求失败');
      }
    };

    resetBtn.onclick = () => { form.reset(); root.querySelector('#game-id').value = ''; };
    backBtn.onclick  = ()   => { renderSiteAdminHome(); };

    loadGames(listWrap);
  }

  async function loadGames(listWrap) {
    try {
      const games = await secureFetch('https://api.am-all.com.cn/api/ccb/games'); // 公开读取
      listWrap.innerHTML = '';
      if (!Array.isArray(games) || games.length === 0) {
        listWrap.innerHTML = '<p class="empty">暂无游戏</p>';
        return;
      }

      listWrap.innerHTML = games.map(g => `
        <div class="admin-item">
          <div class="admin-item-meta">
            <div><b>${g.game_name}</b></div>
            <div>${g.game_title}</div>
          </div>
          <div class="admin-item-actions">
            <button class="admin-btn admin-btn-primary" data-edit="${g.id}">编辑</button>
            <button class="admin-btn admin-btn-danger" data-del="${g.id}">删除</button>
          </div>
        </div>
      `).join('');

      listWrap.onclick = async (e) => {
        const editId = e.target.getAttribute('data-edit');
        const delId  = e.target.getAttribute('data-del');

        if (editId) {
          const g = games.find(x => String(x.id) === String(editId));
          if (!g) return;
          document.getElementById('game-id').value    = g.id;
          document.getElementById('game-title').value = g.game_title || '';
          document.getElementById('game-name').value  = g.game_name  || '';
          document.getElementById('game-form').scrollIntoView({behavior:'smooth', block:'start'});
        }

        if (delId) {
          const token = localStorage.getItem('token');
          if (!token) { showLoginRequired('site-admin'); return; }
          if (!confirm('确认删除该游戏？')) return;

          try {
            const res = await secureFetch(`https://api.am-all.com.cn/api/admin/ccb/games/${encodeURIComponent(delId)}`, {
              method: 'DELETE', headers:{ 'Authorization':`Bearer ${token}` }
            });
            if (res && res.success) {
              showSuccessMessage('删除成功');
              await loadGames(listWrap);
            } else {
              throw new Error(res?.error || '删除失败');
            }
          } catch (err) {
            console.error(err); showErrorMessage(err.message || '请求失败');
          }
        }
      };
    } catch (err) {
      console.error(err);
      showErrorMessage('加载游戏列表失败');
    }
  }

  // 导出给路由/跳转用
  global.renderSiteAdminHome = renderSiteAdminHome;
  global.renderCCBServersPage = renderCCBServersPage;
  global.renderCCBGamesPage = renderCCBGamesPage;

})(window);
