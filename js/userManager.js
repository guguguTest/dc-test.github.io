
// --- helper: get permission modal root safely
function __getPermissionModalRoot(){
  return document.getElementById('permission-modal-root')
      || document.getElementById('permission-modal')
      || document.getElementById('user-permission-modal')
      || document.querySelector('.permission-modal')
      || document.body;
}

class UserManager {
  constructor() {
    this.currentPage = 1;
    this.usersPerPage = 20;
    this.totalPages = 1;
    this.users = [];
    this.editingUserId = null;
    this.permissionModal = null;
    this.currentEditingUserId = null;
    this.currentPermissions = {};
    this.__initializedOnce = false;
    this.__listenersBound = false;
    this.__onDocClick = null;
  }

  init() {
    // 多次进入页面时仅刷新数据
    if (this.__initializedOnce) {
      this.loadUsers();
      return;
    }
    this.__initializedOnce = true;
    this.loadUsers();
    this.setupEventListeners();
  }

  setupEventListeners() {
    if (this.__listenersBound) return;
    this.__listenersBound = true;

    // 搜索
    const searchBtn = document.getElementById('user-search-btn');
    const searchInput = document.getElementById('user-search-input');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        this.currentPage = 1;
        this.loadUsers();
      });
    }
    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.currentPage = 1;
          this.loadUsers();
        }
      });
    }

    // 过滤
    const rankFilter = document.getElementById('user-rank-filter');
    const stateFilter = document.getElementById('user-state-filter');
    if (rankFilter) {
      rankFilter.addEventListener('change', () => {
        this.currentPage = 1;
        this.loadUsers();
      });
    }
    if (stateFilter) {
      stateFilter.addEventListener('change', () => {
        this.currentPage = 1;
        this.loadUsers();
      });
    }

    // 统一事件委托（只绑定一次）
    this.__onDocClick = this.__onDocClick || ((e) => {
      // 仅在用户管理页面内处理
      const isUserManagerVisible = document.querySelector('[data-page="user-manager"], [data-perm-page="user-manager"]');
      if (!isUserManagerVisible || isUserManagerVisible.offsetParent === null) return;

      const target = e.target;

      // 编辑
      if (target.classList.contains('btn-edit')) {
        const userId = parseInt(target.dataset.userId || target.getAttribute('data-user-id'), 10);
        if (!isNaN(userId)) this.toggleEditMode(userId);
        return;
      }
      // 保存（行内保存用户资料）
      if (target.classList.contains('btn-save')) {
        const userId = parseInt(target.dataset.userId || target.getAttribute('data-user-id'), 10);
        if (!isNaN(userId)) this.saveUserChanges(userId);
        return;
      }
      // 取消
      if (target.classList.contains('btn-cancel')) {
        const userId = parseInt(target.dataset.userId || target.getAttribute('data-user-id'), 10);
        if (!isNaN(userId)) this.cancelEditMode(userId);
        return;
      }
      // 授权
      if (target.classList.contains('btn-auth')) {
        e.preventDefault();
        e.stopPropagation();
        const userId = parseInt(target.dataset.userId || target.getAttribute('data-user-id'), 10);
        const inst = (window.userManager && typeof window.userManager.showPermissionModal === 'function') ? window.userManager : this;
        if (inst && typeof inst.showPermissionModal === 'function') {
          inst.showPermissionModal(userId);
        } else if (typeof window.showPermissionModal === 'function') {
          window.showPermissionModal(userId);
        } else {
          console.error('showPermissionModal 未定义');
        }
        return;
      }
    });
    document.addEventListener('click', this.__onDocClick);
  }

  async loadUsers() {
    try {
      const token = localStorage.getItem('token');
      const search = (document.getElementById('user-search-input') || {}).value || '';
      const rankFilter = (document.getElementById('user-rank-filter') || {}).value || '';
      const stateFilter = (document.getElementById('user-state-filter') || {}).value || '';

      let url = `https://api.am-all.com.cn/api/admin/users?page=${this.currentPage}&limit=${this.usersPerPage}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (rankFilter) url += `&user_rank=${rankFilter}`;
      if (stateFilter) url += `&banState=${stateFilter}`;

      const resp = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` }});
      if (!resp.ok) {
        const txt = await resp.text();
        let msg = `获取用户列表失败: ${resp.status}`;
        try {
          const j = JSON.parse(txt);
          msg = j.error || msg;
        } catch {}
        throw new Error(msg);
      }

      const data = await resp.json();
      this.users = data.users || [];
      this.totalPages = (data.pagination && data.pagination.totalPages) || 1;
      this.renderUsers();
      this.renderPagination();
    } catch (err) {
      console.error('加载用户列表失败:', err);
      if (typeof showErrorMessage === 'function') showErrorMessage('加载用户列表失败: ' + err.message);
    }
  }

  renderUsers() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!this.users.length) {
      tbody.innerHTML = '<tr><td colspan="13" class="text-center">没有找到用户</td></tr>';
      return;
    }

    this.users.forEach(user => {
      const isEditing = this.editingUserId === user.id;
      const tr = document.createElement('tr');
      tr.setAttribute('data-user-id', user.id);
      tr.innerHTML = this.getUserRowHTML(user, isEditing);
      tbody.appendChild(tr);
    });
  }

  getUserRowHTML(user, isEditing) {
    const rankMap = {0:'普通用户',1:'初级用户',2:'中级用户',3:'高级用户',4:'贵宾用户',5:'系统管理员'};
    const specialRankMap = {0:'无',1:'MML',
  2:'协同管理员'
};
    const stateMap = {0:'正常',1:'受限',2:'封禁'};
    const avatarUrl = user.avatar ? `https://api.am-all.com.cn/avatars/${user.avatar}` : 'https://api.am-all.com.cn/avatars/default_avatar.png';

    return `
      <td>${isEditing ? `<input type="text" class="edit-mode-input" value="${user.avatar || ''}" data-field="avatar">` : `<img src="${avatarUrl}" class="user-avatar" alt="头像">`}</td>
      <td>${user.uid}</td>
      <td>${isEditing ? `<input type="text" class="edit-mode-input" value="${user.username}" data-field="username">` : user.username}</td>
      <td>${isEditing ? `<input type="text" class="edit-mode-input" value="${user.email || ''}" data-field="email">` : (user.email || '未设置')}</td>
      <td>${isEditing ? `
          <select class="edit-mode-select" data-field="user_rank">
            <option value="0" ${user.user_rank==0?'selected':''}>普通用户</option>
            <option value="1" ${user.user_rank==1?'selected':''}>初级用户</option>
            <option value="2" ${user.user_rank==2?'selected':''}>中级用户</option>
            <option value="3" ${user.user_rank==3?'selected':''}>高级用户</option>
            <option value="4" ${user.user_rank==4?'selected':''}>贵宾用户</option>
            <option value="5" ${user.user_rank==5?'selected':''}>系统管理员</option>
          </select>` : (rankMap[user.user_rank] || '未知')}</td>
      <td>${isEditing ? `
          <select class="edit-mode-select" data-field="rankSp">
            <option value="0" ${user.rankSp==0?'selected':''}>无</option>
            <option value="1" ${user.rankSp==1?'selected':''}>MML</option>
            <option value="2" ${user.rankSp==2?'selected':''}>协同管理员</option>
          </select>` : (specialRankMap[user.rankSp] || '未知')}</td>
      <td>${isEditing ? `<input type="number" class="edit-mode-input" value="${user.points || 0}" data-field="points" min="0">` : (user.points || 0)}</td>
      <td>${isEditing ? `<input type="number" class="edit-mode-input" value="${user.point2 || 0}" data-field="point2" min="0">` : (user.point2 || 0)}</td>
      <td>${isEditing ? `<input type="text" class="edit-mode-input" value="${user.game_server || ''}" data-field="game_server">` : (user.game_server || '未绑定')}</td>
      <td>${isEditing ? `<input type="text" class="edit-mode-input" value="${user.keychip || ''}" data-field="keychip">` : (user.keychip || '未绑定')}</td>
      <td>${isEditing ? `<input type="text" class="edit-mode-input" value="${user.guid || ''}" data-field="guid">` : (user.guid || '未绑定')}</td>
      <td>${isEditing ? `
          <select class="edit-mode-select" data-field="banState">
            <option value="0" ${user.banState==0?'selected':''}>正常</option>
            <option value="1" ${user.banState==1?'selected':''}>受限</option>
            <option value="2" ${user.banState==2?'selected':''}>封禁</option>
          </select>` : (stateMap[user.banState] || '未知')}</td>
      <td class="user-actions">
        ${isEditing ? `
          <button class="btn-save" data-user-id="${user.id}">保存</button>
          <button class="btn-cancel" data-user-id="${user.id}">取消</button>` : `
          <button class="btn-edit" data-user-id="${user.id}">编辑</button>
          <button class="btn-auth" data-user-id="${user.id}">授权</button>`}
      </td>
    `;
  }

  renderPagination() {
    const container = document.getElementById('user-pagination');
    if (!container) return;
    container.innerHTML = '';

    if (this.totalPages <= 1) return;

    const ul = document.createElement('ul');
    ul.className = 'pagination';

    if (this.currentPage > 1) {
      const prevLi = document.createElement('li');
      prevLi.className = 'page-item';
      prevLi.innerHTML = `<a class="page-link" href="#" data-page="${this.currentPage - 1}">上一页</a>`;
      ul.appendChild(prevLi);
    }

    for (let i = 1; i <= this.totalPages; i++) {
      const li = document.createElement('li');
      li.className = `page-item ${i===this.currentPage ? 'active' : ''}`;
      li.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
      ul.appendChild(li);
    }

    if (this.currentPage < this.totalPages) {
      const nextLi = document.createElement('li');
      nextLi.className = 'page-item';
      nextLi.innerHTML = `<a class="page-link" href="#" data-page="${this.currentPage + 1}">下一页</a>`;
      ul.appendChild(nextLi);
    }

    ul.querySelectorAll('.page-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = parseInt(e.currentTarget.dataset.page, 10);
        if (page && page !== this.currentPage) {
          this.currentPage = page;
          this.loadUsers();
        }
      });
    });

    container.appendChild(ul);
  }

  toggleEditMode(userId) {
    this.editingUserId = userId;
    this.renderUsers();
  }

  cancelEditMode(userId) {
    this.editingUserId = null;
    this.renderUsers();
  }

async saveUserChanges(userId) {
  try {
    const token = localStorage.getItem('token');
    const row = document.querySelector(`tr[data-user-id="${userId}"]`);
    if (!row) throw new Error('找不到用户行');

    const updates = {
      username: row.querySelector('[data-field="username"]')?.value,
      email: row.querySelector('[data-field="email"]')?.value,
      user_rank: row.querySelector('[data-field="user_rank"]')?.value,
      rankSp: row.querySelector('[data-field="rankSp"]')?.value,
      points: row.querySelector('[data-field="points"]')?.value,
      point2: row.querySelector('[data-field="point2"]')?.value,
      game_server: row.querySelector('[data-field="game_server"]')?.value,
      keychip: row.querySelector('[data-field="keychip"]')?.value,
      guid: row.querySelector('[data-field="guid"]')?.value,
      banState: row.querySelector('[data-field="banState"]')?.value,
      avatar: row.querySelector('[data-field="avatar"]')?.value
    };

    const resp = await fetch(`https://api.am-all.com.cn/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(txt || `更新用户信息失败: ${resp.status}`);
    }
    const result = await resp.json();
    if (!result.success) throw new Error(result.error || '更新用户信息失败');

    if (typeof showSuccessMessage === 'function') showSuccessMessage(result.message || '用户信息更新成功');
    
    // 如果修改的是当前登录用户，更新本地存储和界面显示
    const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
    if (currentUser && currentUser.id === userId) {
      // 重新获取用户信息
      const token = localStorage.getItem('token');
      if (token) {
        fetch('https://api.am-all.com.cn/api/user', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(user => {
          // 更新本地存储
          localStorage.setItem('userInfo', JSON.stringify(user));
          // 立即更新界面显示
          if (typeof updateUserInfo === 'function') {
            updateUserInfo(user);
          }
          // 更新全局变量
          if (typeof window.currentUser !== 'undefined') {
            window.currentUser = user;
          }
        })
        .catch(err => {
          console.error('更新当前用户信息失败:', err);
        });
      }
    }
    
    this.editingUserId = null;
    this.loadUsers();
  } catch (err) {
    console.error('保存用户信息失败:', err);
    if (typeof showErrorMessage === 'function') showErrorMessage('保存用户信息失败: ' + err.message);
  }
}

  createPermissionModal() {
    // 单例
    const existed = document.getElementById('permission-modal');
    if (existed) { this.permissionModal = existed; return; }

    this.permissionModal = document.createElement('div');
    this.permissionModal.id = 'permission-modal';
    this.permissionModal.className = 'permission-modal';
    this.permissionModal.innerHTML = `
      <div class="permission-modal-content">
        <div class="permission-modal-header">
          <h3>用户权限管理</h3>
          <button class="permission-modal-close" aria-label="关闭">&times;</button>
        </div>
        <div class="permission-modal-body" id="permission-list"></div>
        <div class="permission-modal-footer">
          <button class="btn-cancel" id="permission-cancel">取消</button>
          <button class="btn-save" id="permission-save">保存</button>
        </div>
      </div>
    `;
    document.body.appendChild(this.permissionModal);
    const __pmc = this.permissionModal.querySelector('.permission-modal-content');
    if (__pmc) __pmc.addEventListener('click', (evt)=>evt.stopPropagation());

    // 弹窗内容区阻止冒泡到全局
    const pmc = this.permissionModal.querySelector('.permission-modal-content');
    if (pmc) pmc.addEventListener('click', (e) => e.stopPropagation());

    this.permissionModal.addEventListener('click', (e) => {
      if (e.target === this.permissionModal) this.hidePermissionModal();
    });
    this.permissionModal.querySelector('.permission-modal-close').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation(); this.hidePermissionModal(); } );
    this.permissionModal.querySelector('#permission-cancel').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation(); this.hidePermissionModal(); } );
    this.permissionModal.querySelector('#permission-save').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation(); this.savePermissions(); } );
  }

  async showPermissionModal(userId) {
    this.currentEditingUserId = userId;
    this.createPermissionModal();

    const token = localStorage.getItem('token');
    try {
      const resp = await fetch(`https://api.am-all.com.cn/api/admin/users/${userId}/permissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resp.ok) throw new Error('获取权限失败');
      const data = await resp.json();
      this.currentPermissions = data || {};
    } catch (err) {
      console.error('获取权限失败:', err);
      if (typeof showErrorMessage === 'function') showErrorMessage('获取权限失败');
      return;
    }

    const pages = [
      { id: 'home', name: '首页' },
      { id: 'download', name: '下载中心' },
      { id: 'tools', name: '实用工具' },
      { id: 'dllpatcher', name: '补丁工具' },
      { id: 'settings', name: '设置' },
      { id: 'help', name: '帮助' },
      { id: 'fortune', name: '每日签到' },
      { id: 'user-settings', name: '用户设置' },
      { id: 'announcement-admin', name: '公告管理' },
      { id: 'site-admin', name: '网站管理' },
      { id: 'download-admin', name: '下载管理' },
      { id: 'user-manager', name: '用户管理' },
      { id: 'ccb', name: '游戏查分' },
      { id: 'order-entry', name: '订单录入' },
      { id: 'exchange', name: '积分兑换' }
    ];

    const list = this.permissionModal.querySelector('#permission-list');
    list.innerHTML = '';

    pages.forEach(p => {
      const cur = this.currentPermissions[p.id] || {};
      const allowedChecked = cur.allowed === true || cur.allowed === 1 || cur.allowed === '1';
      const visibleChecked = cur.visible === true || cur.visible === 1 || cur.visible === '1';

      const row = document.createElement('div');
      row.className = 'permission-row';
      row.innerHTML = `
        <div class="permission-name">${p.name}</div>
        <div class="permission-controls">
          <label class="permission-item">
            <span class="permission-label">允许访问</span>
            <label class="switch">
              <input type="checkbox" data-type="allowed" data-perm-page="${p.id}" ${allowedChecked ? 'checked' : ''}>
              <span class="slider round"></span>
            </label>
          </label>
          <label class="permission-item">
            <span class="permission-label">显示入口</span>
            <label class="switch">
              <input type="checkbox" data-type="visible" data-perm-page="${p.id}" ${visibleChecked ? 'checked' : ''}>
              <span class="slider round"></span>
            </label>
          </label>
        </div>
      `;
      list.appendChild(row);
    });

    this.permissionModal.classList.add('show');
  }

  hidePermissionModal() {
    if (this.permissionModal) this.permissionModal.classList.remove('show');
  }

      async savePermissions() {
    try {
      var token = localStorage.getItem('token');
      if (!token) throw new Error('未登录');

      var userId = (this && this.currentEditingUserId) || (this && this.editingUserId) || (this && this.userId);
      if (!userId) throw new Error('缺少用户 ID');

      var root;
      try {
        if (this && this.permissionModal) root = this.permissionModal;
        else if (typeof __getPermissionModalRoot === 'function') root = __getPermissionModalRoot();
        else root = document;
      } catch (_e) { root = document; }

      var rows = (root && root.querySelectorAll('[data-perm-page]')) || [];
      var payload = {};
      rows.forEach(function(input){
        var pid = input.getAttribute('data-perm-page');
        var typ = input.getAttribute('data-type'); // allowed / visible
        if (!pid || !typ) return;
        if (!payload[pid]) payload[pid] = {};
        payload[pid][typ] = !!input.checked;
      });

      var url = (window.API_BASE_URL || 'https://api.am-all.com.cn') + '/api/admin/users/' + encodeURIComponent(userId) + '/permissions';
      var resp = await fetch(url, {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      var data = {};
      try { data = await resp.json(); } catch (_e2) {}

      if (!resp.ok || (data && data.success === false)) {
        throw new Error((data && data.error) || '保存权限失败');
      }

      if (typeof showSuccessMessage === 'function') showSuccessMessage('权限更新成功');

      try {
        var dlg = (root && root.querySelector('dialog[open]')) || null;
        if (dlg && typeof dlg.close === 'function') dlg.close();
        var modal = document.getElementById('user-permission-modal') || document.getElementById('permission-modal') || root;
        if (modal) modal.style.display = 'none';
        var overlay = document.querySelector('.modal-backdrop,.overlay');
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      } catch (_ignore) {}

      try {
        var me = {};
        try { me = JSON.parse(localStorage.getItem('userInfo') || '{}'); } catch(_ee) {}
        if (me && me.id && Number(me.id) === Number(userId) && typeof updateSidebarVisibility === 'function') {
          localStorage.removeItem('userPermissions');
          await updateSidebarVisibility(me);
        }
      } catch (e) {
        console.warn('刷新侧栏失败（非致命）:', e);
      }
    } catch (err) {
      console.error('保存权限失败:', err);
      if (typeof showErrorMessage === 'function') {
        showErrorMessage('保存权限失败：' + ((err && err.message) || '未知错误'));
      } else {
        alert('保存权限失败：' + ((err && err.message) || '未知错误'));
      }
    }
  }
}



// 全局初始化（幂等）
window.initUserManager = function() {
  if (window.userManager && window.userManager.__initializedOnce) {
    window.userManager.loadUsers();
    return;
  }
  window.userManager = new UserManager();
  window.userManager.init();
};

// 旧代码兼容：全局函数
if (typeof window !== 'undefined' && typeof window.showPermissionModal !== 'function') {
  window.showPermissionModal = function(userId) {
    if (window.userManager && typeof window.userManager.showPermissionModal === 'function') {
      window.userManager.showPermissionModal(userId);
    } else {
      console.error('全局 showPermissionModal 不可用：未找到 userManager 实例');
    }
  };
}
