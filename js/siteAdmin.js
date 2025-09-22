// siteAdmin.js – 网站管理（独立）
// 依赖：currentUser / secureFetch / showLoginRequired / showErrorMessage / showSuccessMessage / loadPage

(function (global) {
  'use strict';

  // 确保API_BASE_URL存在
  if (typeof window.API_BASE_URL === 'undefined') {
    window.API_BASE_URL = 'https://api.am-all.com.cn';
  }
  const API_BASE_URL = window.API_BASE_URL;

  // 表情包管理相关全局变量 - 确保在全局作用域
  window.currentEmojiPack = null;
  window.uploadedFiles = [];
  window.folderCreated = false;
  window.currentFolderName = '';
  window.coverImageUrl = null;

  // ---- 公共：管理员访问校验 ----
  function ensureAdmin(pageId) {
    const token = localStorage.getItem('token');
    if (!token) { showLoginRequired(pageId || 'site-admin'); return false; }
    
    if (global.__routeContractInstalledSafe) return true;
    
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

  // ---- 一级页：卡片式入口 ----
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
            <a class="admin-card admin-entry" id="entry-redemption-codes">
              <div class="admin-entry-title">兑换代码管理</div>
              <div class="admin-entry-desc">手动生成和管理兑换码。</div>
              <div class="admin-actions"><button class="admin-btn admin-btn-ghost" type="button">进入</button></div>
            </a>
            <a class="admin-card admin-entry" id="entry-emoji">
              <div class="admin-entry-title">表情管理</div>
              <div class="admin-entry-desc">管理聊天表情包和表情图片。</div>
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
    root.querySelector('#entry-redemption-codes').onclick = (e) => { e.preventDefault(); if (typeof initRedemptionCodeAdmin === 'function') {initRedemptionCodeAdmin();}};
    root.querySelector('#entry-emoji').onclick = (e) => { e.preventDefault(); renderEmojiManagement(); };
  }

  // ---- 二级页：查分服务器设置 ----
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
        if (id) {
          const delRes = await secureFetch(`${API_BASE_URL}/api/admin/ccb/servers/${encodeURIComponent(id)}`, {
            method:'DELETE', headers:{ 'Authorization':`Bearer ${token}` }
          });
          if (!delRes || delRes.success !== true) throw new Error(delRes?.error || '删除失败');
        }

        const postRes = await secureFetch(`${API_BASE_URL}/api/admin/ccb/servers`, {
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
    backBtn.onclick  = () => { renderSiteAdminHome(); };

    loadServers(listWrap);
  }

  async function loadServers(listWrap) {
    try {
      const servers = await secureFetch(`${API_BASE_URL}/api/ccb/servers`);
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
            const res = await secureFetch(`${API_BASE_URL}/api/admin/ccb/servers/${encodeURIComponent(delId)}`, {
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

  // ---- 二级页：查分游戏设置 ----
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
          const delRes = await secureFetch(`${API_BASE_URL}/api/admin/ccb/games/${encodeURIComponent(id)}`, {
            method:'DELETE', headers:{ 'Authorization':`Bearer ${token}` }
          });
          if (!delRes || delRes.success !== true) throw new Error(delRes?.error || '删除失败');
        }

        const postRes = await secureFetch(`${API_BASE_URL}/api/admin/ccb/games`, {
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
    backBtn.onclick  = () => { renderSiteAdminHome(); };

    loadGames(listWrap);
  }

  async function loadGames(listWrap) {
    try {
      const games = await secureFetch(`${API_BASE_URL}/api/ccb/games`);
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
            const res = await secureFetch(`${API_BASE_URL}/api/admin/ccb/games/${encodeURIComponent(delId)}`, {
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

// ========== 表情管理修复开始 ==========
  
  // 工具函数
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 音频管理器
  const AudioManager = {
    currentAudio: null,
    preloadedAudios: new Map(),
    
    preloadAudio(url) {
      if (!this.preloadedAudios.has(url)) {
        const audio = new Audio(url);
        audio.preload = 'auto';
        audio.volume = 0.7;
        this.preloadedAudios.set(url, audio);
      }
    },
    
    playAudio(url) {
      try {
        if (this.currentAudio) {
          this.currentAudio.pause();
          this.currentAudio.currentTime = 0;
        }
        
        let audio = this.preloadedAudios.get(url);
        if (!audio) {
          audio = new Audio(url);
          audio.volume = 0.7;
          this.preloadedAudios.set(url, audio);
        }
        
        const audioClone = audio.cloneNode();
        audioClone.volume = 0.7;
        this.currentAudio = audioClone;
        
        const playPromise = audioClone.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log('音频自动播放被阻止:', error);
          });
        }
      } catch (error) {
        console.error('播放音频失败:', error);
      }
    },
    
    stopAll() {
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }
    }
  };

  // 暴露音频管理器到全局
  window.EmojiAudioManager = AudioManager;

  // 渲染表情管理页面
  async function renderEmojiManagement() {
    const container = document.getElementById('content-container');
    if (!container) return;
    
    container.innerHTML = `
      <div class="emoji-management">
        <div class="emoji-management-header">
          <h1 class="emoji-management-title">
            <i class="far fa-smile"></i> 表情管理
          </h1>
          <div class="emoji-management-actions">
            <button class="btn-add-emoji-pack" onclick="openAddEmojiPackModal()">
              <i class="fas fa-plus"></i> 添加表情包
            </button>
            <button class="btn-back" onclick="renderSiteAdminHome()">
              <i class="fas fa-arrow-left"></i> 返回
            </button>
          </div>
        </div>
        <div id="emoji-packs-container">
          <div class="emoji-loading">
            <i class="fas fa-spinner fa-spin"></i> 加载中...
          </div>
        </div>
      </div>
    `;
    
    loadEmojiPacksList();
  }

  // 加载表情包列表
  async function loadEmojiPacksList() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/emoji/packs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const packs = await response.json();
        renderEmojiPacksGrid(packs);
      }
    } catch (error) {
      console.error('加载表情包列表失败:', error);
    }
  }

  // 渲染表情包网格
  function renderEmojiPacksGrid(packs) {
    const container = document.getElementById('emoji-packs-container');
    if (!container) return;
    
    if (packs.length === 0) {
      container.innerHTML = `
        <div class="emoji-empty">
          <div class="emoji-empty-icon"><i class="far fa-folder-open"></i></div>
          <div class="emoji-empty-text">暂无表情包</div>
        </div>
      `;
      return;
    }
    
    const grid = document.createElement('div');
    grid.className = 'emoji-packs-grid';
    
    packs.forEach(pack => {
      const card = document.createElement('div');
      card.className = 'emoji-pack-card';
      if (pack.is_audio_pack) {
        card.classList.add('audio-pack');
      }
      
      card.innerHTML = `
        <div class="emoji-pack-cover">
          ${pack.cover_image ? 
            `<img src="${API_BASE_URL}${pack.cover_image}" alt="${pack.pack_name}">` :
            '<i class="far fa-smile" style="font-size: 48px; color: #65676b;"></i>'
          }
          ${pack.is_audio_pack ? '<div class="audio-pack-badge"><i class="fas fa-volume-up"></i> 音频表情</div>' : ''}
        </div>
        <div class="emoji-pack-info">
          <div class="emoji-pack-name">${escapeHtml(pack.pack_name)}</div>
          <div class="emoji-pack-actions">
            <button class="emoji-pack-btn edit" onclick="editEmojiPack(${pack.id})">
              <i class="fas fa-edit"></i>
              <span>编辑</span>
            </button>
            <button class="emoji-pack-btn delete" onclick="deleteEmojiPack(${pack.id})">
              <i class="fas fa-trash"></i>
              <span>删除</span>
            </button>
          </div>
        </div>
      `;
      
      grid.appendChild(card);
    });
    
    container.innerHTML = '';
    container.appendChild(grid);
  }

  // 创建表情包弹窗（增强版 - 包含音频功能）
  function createEmojiPackModal() {
    const modal = document.createElement('div');
    modal.id = 'emoji-pack-modal';
    modal.className = 'emoji-pack-modal';
    modal.innerHTML = `
      <div class="emoji-pack-modal-content">
        <div class="emoji-pack-modal-header">
          <h3 class="emoji-pack-modal-title">添加表情包</h3>
          <button class="emoji-pack-modal-close" onclick="closeEmojiPackModal()">&times;</button>
        </div>
        <div class="emoji-pack-modal-body">
          <div class="emoji-form-group">
            <label class="emoji-form-label">表情包名称</label>
            <input type="text" id="emoji-pack-name" class="emoji-form-input" placeholder="输入表情包名称">
          </div>
          
          <!-- 音频表情包选项 -->
          <div class="emoji-form-group" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <label class="emoji-form-label" style="display: flex; align-items: center; margin-bottom: 10px; cursor: pointer;">
              <input type="checkbox" id="is-audio-pack" onchange="toggleAudioPackOption()" style="margin-right: 10px; width: 20px; height: 20px;">
              <span style="font-size: 18px; color: white; font-weight: bold;">
                <i class="fas fa-music" style="margin-right: 8px;"></i>
                启用音频表情包功能
              </span>
            </label>
            <small class="emoji-form-hint" style="color: #fff; opacity: 0.9; font-size: 13px;">
              <i class="fas fa-info-circle"></i> 
              勾选后可为每个表情添加对应的音效文件（支持 m4a、mp3、wav 格式）
            </small>
          </div>
          
          <div class="emoji-form-group">
            <label class="emoji-form-label">文件夹名称（英文或数字）</label>
            <div class="emoji-folder-input-group">
              <input type="text" id="emoji-folder-name" class="emoji-form-input" placeholder="例如: emoji_01">
              <button type="button" id="create-folder-btn" class="emoji-form-btn" onclick="createEmojiFolder()">创建文件夹</button>
            </div>
            <small class="emoji-form-hint">请先创建文件夹后再上传图片</small>
            <div id="folder-status" style="margin-top: 5px; display: none;"></div>
          </div>
          
          <div class="emoji-form-group">
            <label class="emoji-form-label">表情包封面</label>
            <div class="emoji-upload-area disabled" id="cover-upload-area">
              <div class="emoji-upload-icon"><i class="fas fa-image"></i></div>
              <div class="emoji-upload-text">请先创建文件夹</div>
              <div class="emoji-upload-hint">创建文件夹后才能上传</div>
            </div>
            <input type="file" id="emoji-pack-cover" accept="image/*" style="display: none;">
          </div>
          
          <div class="emoji-form-group">
            <label class="emoji-form-label">上传表情图片</label>
            <div class="emoji-upload-area disabled" id="images-upload-area">
              <div class="emoji-upload-icon"><i class="fas fa-cloud-upload-alt"></i></div>
              <div class="emoji-upload-text">请先创建文件夹</div>
              <div class="emoji-upload-hint">创建文件夹后才能上传</div>
            </div>
            <input type="file" id="emoji-pack-images" accept="image/*" multiple style="display: none;">
          </div>
          
          <!-- 音频上传区域 -->
          <div class="emoji-form-group" id="audio-upload-section" style="display: none;">
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <label class="emoji-form-label" style="color: white; font-size: 16px; font-weight: bold;">
                <i class="fas fa-headphones"></i> 上传音频文件
              </label>
              <div class="audio-mapping-hint" style="background: rgba(255,255,255,0.95); border: none; color: #333; margin-top: 10px; padding: 12px;">
                <i class="fas fa-info-circle" style="color: #f5576c;"></i> 
                <div>
                  <strong>重要说明：</strong><br>
                  • 音频文件将按上传顺序与表情图片一一对应<br>
                  • 第1个音频对应第1个表情，第2个音频对应第2个表情，以此类推<br>
                  • 请确保音频数量与图片数量一致，或少于图片数量<br>
                  • 支持格式：.m4a .mp3 .wav
                </div>
              </div>
            </div>
            <div class="emoji-upload-area disabled" id="audio-upload-area" style="background: #fff5f5; border: 2px dashed #f5576c;">
              <div class="emoji-upload-icon" style="color: #f5576c;"><i class="fas fa-file-audio"></i></div>
              <div class="emoji-upload-text" style="color: #f5576c;">请先创建文件夹并上传图片</div>
              <div class="emoji-upload-hint" style="color: #f093fb;">支持批量上传音频文件</div>
            </div>
            <input type="file" id="emoji-pack-audios" accept="audio/*,.m4a,.mp3,.wav" multiple style="display: none;">
          </div>
          
          <div id="emoji-upload-progress" class="emoji-upload-progress" style="display: none;">
            <div class="emoji-progress-bar">
              <div id="emoji-progress-fill" class="emoji-progress-fill" style="width: 0;"></div>
            </div>
            <div id="emoji-progress-text" class="emoji-progress-text">上传中 0%</div>
          </div>
          
          <div id="emoji-preview-grid" class="emoji-preview-grid"></div>
        </div>
        <div class="emoji-pack-modal-footer">
          <button class="emoji-modal-btn cancel" onclick="closeEmojiPackModal()">取消</button>
          <button class="emoji-modal-btn save" onclick="saveEmojiPack()">保存</button>
        </div>
      </div>
    `;
    
    return modal;
  }

  // 切换音频表情包选项
  window.toggleAudioPackOption = function() {
    const checkbox = document.getElementById('is-audio-pack');
    if (!checkbox) return;
    
    const isAudioPack = checkbox.checked;
    window.isAudioPack = isAudioPack;
    
    const audioUploadSection = document.getElementById('audio-upload-section');
    if (audioUploadSection) {
      if (isAudioPack) {
        audioUploadSection.style.display = 'block';
        audioUploadSection.style.opacity = '0';
        setTimeout(() => {
          audioUploadSection.style.opacity = '1';
          audioUploadSection.style.transition = 'opacity 0.3s';
        }, 10);
        
        // 如果文件夹已创建且有图片，启用音频上传
        if (window.folderCreated && window.uploadedFiles.length > 0) {
          enableAudioUploadArea();
        }
      } else {
        audioUploadSection.style.opacity = '0';
        setTimeout(() => {
          audioUploadSection.style.display = 'none';
        }, 300);
      }
    }
    
    console.log('音频表情包选项已切换:', isAudioPack);
  };

  // 打开添加表情包弹窗（增强版）
  window.openAddEmojiPackModal = function() {
    // 重置所有状态
    window.currentEmojiPack = null;
    window.uploadedFiles = [];
    window.uploadedAudios = [];
    window.folderCreated = false;
    window.currentFolderName = '';
    window.coverImageUrl = null;
    window.isAudioPack = false;
    
    // 移除旧的弹窗（如果存在）
    let oldModal = document.getElementById('emoji-pack-modal');
    if (oldModal) {
      oldModal.remove();
    }
    
    // 创建新的弹窗
    let modal = createEmojiPackModal();
    document.body.appendChild(modal);
    
    // 确保所有元素都已加载
    setTimeout(() => {
      // 重置表单
      const packNameInput = document.getElementById('emoji-pack-name');
      const folderNameInput = document.getElementById('emoji-folder-name');
      const audioCheckbox = document.getElementById('is-audio-pack');
      
      if (packNameInput) packNameInput.value = '';
      if (folderNameInput) {
        folderNameInput.value = '';
        folderNameInput.disabled = false;
      }
      if (audioCheckbox) {
        audioCheckbox.checked = false;
      }
      
      const createBtn = document.getElementById('create-folder-btn');
      if (createBtn) {
        createBtn.disabled = false;
        createBtn.textContent = '创建文件夹';
      }
      
      const folderStatus = document.getElementById('folder-status');
      if (folderStatus) {
        folderStatus.style.display = 'none';
        folderStatus.innerHTML = '';
      }
      
      const previewGrid = document.getElementById('emoji-preview-grid');
      if (previewGrid) previewGrid.innerHTML = '';
      
      // 音频上传区域默认隐藏
      const audioUploadSection = document.getElementById('audio-upload-section');
      if (audioUploadSection) {
        audioUploadSection.style.display = 'none';
      }
      
      // 确保上传区域是禁用状态
      const coverArea = document.getElementById('cover-upload-area');
      const imagesArea = document.getElementById('images-upload-area');
      
      if (coverArea) {
        coverArea.className = 'emoji-upload-area disabled';
        coverArea.innerHTML = `
          <div class="emoji-upload-icon"><i class="fas fa-image"></i></div>
          <div class="emoji-upload-text">请先创建文件夹</div>
          <div class="emoji-upload-hint">创建文件夹后才能上传</div>
        `;
      }
      
      if (imagesArea) {
        imagesArea.className = 'emoji-upload-area disabled';
        imagesArea.innerHTML = `
          <div class="emoji-upload-icon"><i class="fas fa-cloud-upload-alt"></i></div>
          <div class="emoji-upload-text">请先创建文件夹</div>
          <div class="emoji-upload-hint">创建文件夹后才能上传</div>
        `;
      }
      
      modal.querySelector('.emoji-pack-modal-title').textContent = '添加表情包';
      modal.classList.add('show');
      
      console.log('表情包弹窗已打开（含音频功能）');
    }, 100);
  }

  // 创建文件夹函数（增强版）
  window.createEmojiFolder = async function() {
    const folderNameInput = document.getElementById('emoji-folder-name');
    const folderName = folderNameInput.value.trim();
    
    if (!folderName) {
      showErrorMessage('请输入文件夹名称');
      return;
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(folderName)) {
      showErrorMessage('文件夹名称只能包含英文、数字、下划线和横线');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      showErrorMessage('请先登录');
      return;
    }
    
    const createBtn = document.getElementById('create-folder-btn');
    createBtn.disabled = true;
    createBtn.textContent = '创建中...';
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/emoji/create-folder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          folder_name: folderName,
          create_sounds_folder: window.isAudioPack // 如果是音频表情包，同时创建sounds文件夹
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        // 更新状态
        window.folderCreated = true;
        window.currentFolderName = folderName;
        
        // 更新UI
        folderNameInput.disabled = true;
        createBtn.disabled = true;
        createBtn.textContent = '已创建';
        
        const statusDiv = document.getElementById('folder-status');
        statusDiv.innerHTML = `✔ 文件夹 "${folderName}" 已创建${window.isAudioPack ? '（含音频文件夹）' : ''}`;
        statusDiv.style.display = 'block';
        statusDiv.style.color = '#28a745';
        
        // 启用上传区域
        enableUploadAreas();
        
        showSuccessMessage('文件夹创建成功，现在可以上传图片了');
      } else {
        throw new Error(result.error || '创建文件夹失败');
      }
    } catch (error) {
      createBtn.disabled = false;
      createBtn.textContent = '创建文件夹';
      showErrorMessage(error.message || '创建文件夹失败');
    }
  }

  // 启用上传区域（增强版）
  function enableUploadAreas() {
    const coverArea = document.getElementById('cover-upload-area');
    const imagesArea = document.getElementById('images-upload-area');
    const coverInput = document.getElementById('emoji-pack-cover');
    const imagesInput = document.getElementById('emoji-pack-images');
    
    if (!window.currentFolderName || !window.folderCreated) {
      return;
    }
    
    // 启用封面上传
    coverArea.classList.remove('disabled');
    coverArea.innerHTML = `
      <div class="emoji-upload-icon"><i class="fas fa-image"></i></div>
      <div class="emoji-upload-text">点击上传封面图片</div>
      <div class="emoji-upload-hint" style="color: #28a745;">将上传到: ${window.currentFolderName}/jacket/</div>
    `;
    coverArea.onclick = () => coverInput.click();
    
    // 绑定封面上传事件
    coverInput.onchange = function() {
      handleCoverUpload(this);
    };
    
    // 启用表情上传
    imagesArea.classList.remove('disabled');
    imagesArea.innerHTML = `
      <div class="emoji-upload-icon"><i class="fas fa-cloud-upload-alt"></i></div>
      <div class="emoji-upload-text">点击或拖拽上传表情图片</div>
      <div class="emoji-upload-hint" style="color: #28a745;">将上传到: ${window.currentFolderName}/</div>
    `;
    imagesArea.onclick = () => imagesInput.click();
    
    // 绑定表情上传事件
    imagesInput.onchange = function() {
      handleImagesUpload(this);
    };
    
    // 设置拖拽事件
    imagesArea.ondragover = (e) => {
      e.preventDefault();
      imagesArea.classList.add('dragover');
    };
    
    imagesArea.ondrop = (e) => {
      e.preventDefault();
      imagesArea.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        imagesInput.files = files;
        handleImagesUpload(imagesInput);
      }
    };
    
    imagesArea.ondragleave = () => {
      imagesArea.classList.remove('dragover');
    };
  }

  // 启用音频上传区域
  function enableAudioUploadArea() {
    if (!window.isAudioPack) return;
    
    const audioArea = document.getElementById('audio-upload-area');
    const audioInput = document.getElementById('emoji-pack-audios');
    
    if (!audioArea || !audioInput) return;
    
    audioArea.classList.remove('disabled');
    audioArea.innerHTML = `
      <div class="emoji-upload-icon"><i class="fas fa-music"></i></div>
      <div class="emoji-upload-text">点击上传音频文件</div>
      <div class="emoji-upload-hint" style="color: #28a745;">将上传到: ${window.currentFolderName}/sounds/</div>
      <div style="margin-top: 5px; font-size: 12px; color: #666;">已上传 ${window.uploadedFiles.length} 个表情，请上传对应数量的音频</div>
    `;
    audioArea.onclick = () => audioInput.click();
    audioInput.onchange = function() { handleAudiosUpload(this); };
  }

  // 处理封面上传
  window.handleCoverUpload = async function(input) {
    const file = input.files[0];
    if (!file) return;
    
    if (!window.folderCreated || !window.currentFolderName) {
      showErrorMessage('请先创建文件夹');
      input.value = '';
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      showErrorMessage('请先登录');
      input.value = '';
      return;
    }
    
    const formData = new FormData();
    formData.append('cover', file);
    
    const url = `${API_BASE_URL}/api/admin/emoji/upload-cover?folder_name=${encodeURIComponent(window.currentFolderName)}&type=cover`;
    
    const coverArea = document.getElementById('cover-upload-area');
    coverArea.innerHTML = '<div class="emoji-loading"><i class="fas fa-spinner fa-spin"></i> 上传中...</div>';
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        window.coverImageUrl = result.url;
        coverArea.innerHTML = `
          <img src="${API_BASE_URL}${result.url}" style="max-width: 100%; max-height: 200px; border-radius: 8px;">
          <div style="margin-top: 5px; color: #28a745; font-size: 12px;">封面已上传</div>
        `;
        showSuccessMessage('封面上传成功');
      } else {
        throw new Error(result.error || '上传失败');
      }
    } catch (error) {
      console.error('封面上传错误:', error);
      coverArea.innerHTML = `
        <div class="emoji-upload-icon"><i class="fas fa-image"></i></div>
        <div class="emoji-upload-text" style="color: #dc3545;">上传失败，点击重试</div>
      `;
      coverArea.onclick = () => document.getElementById('emoji-pack-cover').click();
      showErrorMessage(error.message || '上传封面失败');
    }
    
    input.value = '';
  }

  // 处理表情上传
  window.handleImagesUpload = async function(input) {
    const files = Array.from(input.files);
    if (files.length === 0) return;
    
    if (!window.folderCreated || !window.currentFolderName) {
      showErrorMessage('请先创建文件夹');
      input.value = '';
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      showErrorMessage('请先登录');
      input.value = '';
      return;
    }
    
    const progressDiv = document.getElementById('emoji-upload-progress');
    const progressFill = document.getElementById('emoji-progress-fill');
    const progressText = document.getElementById('emoji-progress-text');
    progressDiv.style.display = 'block';
    
    let uploaded = 0;
    const total = files.length;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('image', file);
      
      try {
        const url = `${API_BASE_URL}/api/admin/emoji/upload-image?folder_name=${encodeURIComponent(window.currentFolderName)}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          window.uploadedFiles.push({
            index: i,
            file_name: result.file_name || file.name,
            file_path: result.url,
            emoji_name: file.name.replace(/\.[^/.]+$/, ''),
            sort_order: window.uploadedFiles.length
          });
        } else {
          showErrorMessage(`上传 ${file.name} 失败: ${result.error}`);
        }
      } catch (error) {
        console.error('上传错误:', error);
        showErrorMessage(`上传 ${file.name} 失败`);
      }
      
      uploaded++;
      const progress = Math.round((uploaded / total) * 100);
      progressFill.style.width = progress + '%';
      progressText.textContent = `上传中 ${progress}% (${uploaded}/${total})`;
    }
    
    renderUploadedEmojis();
    showSuccessMessage(`成功上传 ${window.uploadedFiles.length} 个表情`);
    
    // 如果是音频表情包，启用音频上传
    if (window.isAudioPack) {
      enableAudioUploadArea();
    }
    
    setTimeout(() => {
      progressDiv.style.display = 'none';
      progressFill.style.width = '0%';
      progressText.textContent = '上传中 0%';
    }, 2000);
    
    input.value = '';
  }

  // 处理音频文件上传
  async function handleAudiosUpload(input) {
    const files = Array.from(input.files);
    if (files.length === 0) return;
    
    if (!window.folderCreated || !window.currentFolderName) {
      showErrorMessage('请先创建文件夹');
      input.value = '';
      return;
    }
    
    if (files.length !== window.uploadedFiles.length) {
      if (!confirm(`音频文件数量(${files.length})与图片数量(${window.uploadedFiles.length})不一致。是否继续？`)) {
        input.value = '';
        return;
      }
    }
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const progressDiv = document.getElementById('emoji-upload-progress');
    const progressFill = document.getElementById('emoji-progress-fill');
    const progressText = document.getElementById('emoji-progress-text');
    progressDiv.style.display = 'block';
    
    let uploaded = 0;
    const total = files.length;
    
    window.uploadedAudios = []; // 清空音频数组
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('audio', file);
      
      try {
        const url = `${API_BASE_URL}/api/admin/emoji/upload-audio?folder_name=${encodeURIComponent(window.currentFolderName)}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          window.uploadedAudios.push({
            index: i,
            file_name: result.file_name || file.name,
            file_path: result.url
          });
          
          // 更新对应的表情数据
          if (window.uploadedFiles[i]) {
            window.uploadedFiles[i].audio_path = result.url;
          }
        } else {
          showErrorMessage(`上传音频 ${file.name} 失败: ${result.error}`);
        }
      } catch (error) {
        showErrorMessage(`上传音频 ${file.name} 失败`);
      }
      
      uploaded++;
      const progress = Math.round((uploaded / total) * 100);
      progressFill.style.width = progress + '%';
      progressText.textContent = `上传音频中 ${progress}% (${uploaded}/${total})`;
    }
    
    renderUploadedEmojis(); // 重新渲染以显示音频标记
    showSuccessMessage(`成功上传 ${window.uploadedAudios.length} 个音频文件`);
    
    setTimeout(() => {
      progressDiv.style.display = 'none';
      progressFill.style.width = '0%';
    }, 2000);
    
    input.value = '';
  }
  
  // 播放表情音频预览
  window.playEmojiAudio = function(audioPath) {
    AudioManager.playAudio(`${API_BASE_URL}${audioPath}`);
  };

  // 渲染已上传的表情
  function renderUploadedEmojis() {
    const grid = document.getElementById('emoji-preview-grid');
    grid.innerHTML = '';
    
    window.uploadedFiles.forEach((file, index) => {
      const item = document.createElement('div');
      item.className = 'emoji-preview-item';
      if (file.audio_path) {
        item.classList.add('has-audio');
      }
      
      item.innerHTML = `
        <img src="${API_BASE_URL}${file.file_path}" class="emoji-preview-image">
        ${file.audio_path ? '<i class="fas fa-volume-up audio-indicator"></i>' : ''}
        <input type="text" class="emoji-name-input" placeholder="表情名称" 
               value="${file.emoji_name}" 
               onchange="updateEmojiName(${index}, this.value)">
        <button class="emoji-preview-remove" onclick="removeUploadedEmoji(${index})">删除</button>
        ${file.audio_path ? `
          <button class="emoji-preview-play" onclick="playEmojiAudio('${file.audio_path}')">
            <i class="fas fa-play"></i> 试听
          </button>
        ` : ''}
      `;
      grid.appendChild(item);
    });
  }

  // 更新表情名称
  window.updateEmojiName = function(index, name) {
    if (window.uploadedFiles[index]) {
      window.uploadedFiles[index].emoji_name = name;
    }
  }

  // 删除已上传的表情
  window.removeUploadedEmoji = function(index) {
    window.uploadedFiles.splice(index, 1);
    // 同时移除对应的音频
    if (window.uploadedAudios && window.uploadedAudios[index]) {
      window.uploadedAudios.splice(index, 1);
    }
    renderUploadedEmojis();
  }

  // 保存表情包（增强版）
  window.saveEmojiPack = async function() {
    const packName = document.getElementById('emoji-pack-name').value.trim();
    
    if (!packName) {
      showErrorMessage('请填写表情包名称');
      return;
    }
    
    if (!window.folderCreated || !window.currentFolderName) {
      showErrorMessage('请先创建文件夹');
      return;
    }
    
    if (window.uploadedFiles.length === 0) {
      showErrorMessage('请上传至少一个表情图片');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      showErrorMessage('请先登录');
      return;
    }
    
    const isAudioPack = document.getElementById('is-audio-pack').checked;
    
    const data = {
      pack_name: packName,
      folder_name: window.currentFolderName,
      cover_image: window.coverImageUrl,
      is_audio_pack: isAudioPack,
      emojis: window.uploadedFiles.map((file, index) => ({
        ...file,
        sort_order: index
      }))
    };
    
    try {
      const url = window.currentEmojiPack 
        ? `${API_BASE_URL}/api/admin/emoji/packs/${window.currentEmojiPack.id}`
        : `${API_BASE_URL}/api/admin/emoji/packs`;
      
      const response = await fetch(url, {
        method: window.currentEmojiPack ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        closeEmojiPackModal();
        await loadEmojiPacksList();
        showSuccessMessage(window.currentEmojiPack ? '表情包更新成功' : '表情包添加成功');
      } else {
        showErrorMessage(result.error || '操作失败');
      }
    } catch (error) {
      showErrorMessage('保存失败: ' + error.message);
    }
  }

  // 关闭表情包弹窗
  window.closeEmojiPackModal = function() {
    const modal = document.getElementById('emoji-pack-modal');
    if (modal) {
      modal.classList.remove('show');
    }
    
    // 重置所有状态
    window.currentEmojiPack = null;
    window.uploadedFiles = [];
    window.uploadedAudios = [];
    window.folderCreated = false;
    window.currentFolderName = '';
    window.coverImageUrl = null;
    window.isAudioPack = false;
  }

  // 编辑表情包
  window.editEmojiPack = async function(packId) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/emoji/packs/${packId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        window.currentEmojiPack = await response.json();
        openEditEmojiPackModal();
      }
    } catch (error) {
      console.error('获取表情包详情失败:', error);
    }
  }

  // 打开编辑表情包弹窗
  function openEditEmojiPackModal() {
    if (!window.currentEmojiPack) return;
    
    let modal = document.getElementById('emoji-pack-modal');
    if (!modal) {
      modal = createEmojiPackModal();
      document.body.appendChild(modal);
    }
    
    // 填充数据
    document.getElementById('emoji-pack-name').value = window.currentEmojiPack.pack_name;
    document.getElementById('emoji-folder-name').value = window.currentEmojiPack.folder_name;
    document.getElementById('emoji-folder-name').disabled = true;
    document.getElementById('is-audio-pack').checked = window.currentEmojiPack.is_audio_pack || false;
    
    const createBtn = document.getElementById('create-folder-btn');
    createBtn.disabled = true;
    createBtn.textContent = '文件夹已存在';
    
    // 设置已创建文件夹状态
    window.folderCreated = true;
    window.currentFolderName = window.currentEmojiPack.folder_name;
    window.isAudioPack = window.currentEmojiPack.is_audio_pack || false;
    
    const statusDiv = document.getElementById('folder-status');
    statusDiv.textContent = `文件夹: ${window.currentFolderName}`;
    statusDiv.style.display = 'block';
    
    // 显示音频上传区域（如果需要）
    if (window.isAudioPack) {
      const audioSection = document.getElementById('audio-upload-section');
      if (audioSection) {
        audioSection.style.display = 'block';
      }
      enableAudioUploadArea();
    }
    
    // 启用上传区域
    enableUploadAreas();
    
    // 显示封面
    const coverArea = document.getElementById('cover-upload-area');
    if (window.currentEmojiPack.cover_image) {
      window.coverImageUrl = window.currentEmojiPack.cover_image;
      coverArea.innerHTML = `<img src="${API_BASE_URL}${window.currentEmojiPack.cover_image}" style="max-width: 100%; max-height: 200px;">`;
    }
    
    window.uploadedFiles = window.currentEmojiPack.emojis || [];
    renderUploadedEmojis();
    
    modal.querySelector('.emoji-pack-modal-title').textContent = '编辑表情包';
    modal.classList.add('show');
  }

  // 删除表情包
  window.deleteEmojiPack = async function(packId) {
    if (!confirm('确定要删除这个表情包吗？将删除所有相关文件。')) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/emoji/packs/${packId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        loadEmojiPacksList();
        showSuccessMessage('表情包已删除');
      }
    } catch (error) {
      console.error('删除表情包失败:', error);
      showErrorMessage('删除失败');
    }
  }

  // ========== 表情管理修复结束 ==========

  // 导出给路由/跳转用
  global.renderSiteAdminHome = renderSiteAdminHome;
  global.renderCCBServersPage = renderCCBServersPage;
  global.renderCCBGamesPage = renderCCBGamesPage;
  global.renderEmojiManagement = renderEmojiManagement;
  
})(window);