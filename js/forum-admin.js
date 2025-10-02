// forum-admin.js - 论坛管理功能模块（修复版）

(function() {
  'use strict';

  const API_BASE = 'https://api.am-all.com.cn/api';

  // 初始化论坛管理
  function initForumAdmin() {
    const container = document.getElementById('content-container');
    if (!container) return;

    container.innerHTML = `
      <div class="forum-container">
        <div class="forum-header">
          <h1 class="forum-title">
            <i class="fas fa-cog"></i>
            论坛管理
          </h1>
          <p class="forum-subtitle">管理论坛分区、标签和用户权限</p>
        </div>
        
        <div class="admin-grid">
          <div class="admin-card" onclick="window.ForumAdminModule.showUserPermissions()">
            <div class="admin-card-icon">
              <i class="fas fa-user-shield"></i>
            </div>
            <div class="admin-card-title">发帖权限管理</div>
            <div class="admin-card-desc">管理用户的发帖和回帖权限</div>
          </div>
          
          <div class="admin-card" onclick="window.ForumAdminModule.showTagManagement()">
            <div class="admin-card-icon">
              <i class="fas fa-tags"></i>
            </div>
            <div class="admin-card-title">发帖分类管理</div>
            <div class="admin-card-desc">管理论坛帖子分类标签</div>
          </div>
        </div>
      </div>
    `;
  }

  // 显示用户权限管理
  async function showUserPermissions() {
    const container = document.getElementById('content-container');
    
    container.innerHTML = `
      <div class="forum-container">
        <div class="forum-header">
          <button class="forum-btn forum-btn-secondary" onclick="window.ForumAdminModule.init()">
            <i class="fas fa-arrow-left"></i>
            返回
          </button>
          <h1 class="forum-title">发帖权限管理</h1>
        </div>
        
        <div class="forum-toolbar">
          <div class="toolbar-left">
            <div class="forum-search">
              <i class="fas fa-search"></i>
              <input type="text" id="user-search-input" placeholder="搜索用户...">
            </div>
          </div>
        </div>
        
        <div class="admin-table" id="user-permissions-table">
          <div class="forum-loading">
            <div class="forum-spinner"></div>
          </div>
        </div>
      </div>
    `;

    await loadUserPermissions();

    const searchInput = document.getElementById('user-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', debounce(() => {
        loadUserPermissions(searchInput.value);
      }, 500));
    }
  }

  // 加载用户权限列表（修复API路径）
  async function loadUserPermissions(keyword = '') {
    const token = localStorage.getItem('token');
    const container = document.getElementById('user-permissions-table');
    
    try {
      // 修复：统一API路径
      const url = `${API_BASE}/forum/admin/permissions?keyword=${encodeURIComponent(keyword)}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('加载失败');
      
      const data = await response.json();
      renderUserPermissions(data.users);
    } catch (error) {
      console.error('加载用户权限失败:', error);
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-circle"></i>
          <p>加载失败，请刷新重试</p>
        </div>
      `;
    }
  }

  // 渲染用户权限列表
  function renderUserPermissions(users) {
    const container = document.getElementById('user-permissions-table');
    
    if (!users || users.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>暂无用户数据</p>
        </div>
      `;
      return;
    }

    let html = `
      <table>
        <thead>
          <tr>
            <th width="60">头像</th>
            <th>用户名</th>
            <th>昵称</th>
            <th width="100">UID</th>
            <th width="180">发帖权限</th>
            <th width="180">回帖权限</th>
            <th width="120">操作</th>
          </tr>
        </thead>
        <tbody>
    `;

    users.forEach(user => {
      const userId = user.id;
      const postRestriction = user.post_restriction_type || 'none';
      const replyRestriction = user.reply_restriction_type || 'none';

      html += `
        <tr data-user-id="${userId}">
          <td>
            <img src="${user.avatar || 'https://api.am-all.com.cn/avatars/default_avatar.png'}" 
                 style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" alt="avatar">
          </td>
          <td>${escapeHtml(user.username)}</td>
          <td>${escapeHtml(user.nickname || '-')}</td>
          <td>${user.uid}</td>
          <td>
            <span class="permission-display-${userId}-post">
              ${getRestrictionBadge(postRestriction)}
            </span>
          </td>
          <td>
            <span class="permission-display-${userId}-reply">
              ${getRestrictionBadge(replyRestriction)}
            </span>
          </td>
          <td>
            <button class="forum-btn forum-btn-primary forum-btn-sm" 
                    onclick="window.ForumAdminModule.editUserPermission(${userId})">
              <i class="fas fa-edit"></i> 编辑
            </button>
          </td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    container.innerHTML = html;
  }

  // 获取限制状态徽章
  function getRestrictionBadge(type) {
    const badges = {
      'none': '<span class="status-badge" style="background: #10b981; color: white;">不限制</span>',
      'permanent': '<span class="status-badge" style="background: #ef4444; color: white;">永久限制</span>',
      'temporary': '<span class="status-badge" style="background: #f59e0b; color: white;">限时限制</span>'
    };
    return badges[type] || badges.none;
  }

  // 编辑用户权限（修复API路径）
  async function editUserPermission(userId) {
    const token = localStorage.getItem('token');
    
    try {
      // 修复：统一API路径
      const response = await fetch(`${API_BASE}/forum/admin/permissions/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('获取权限失败');
      
      const permission = await response.json();
      showPermissionEditModal(userId, permission);
    } catch (error) {
      console.error('获取用户权限失败:', error);
      if (typeof showErrorMessage === 'function') {
        showErrorMessage('获取权限失败');
      }
    }
  }

  // 显示权限编辑模态框
  function showPermissionEditModal(userId, permission) {
    const modal = document.createElement('div');
    modal.className = 'forum-modal show';
    modal.id = 'permission-edit-modal';
    
    modal.innerHTML = `
      <div class="forum-modal-content">
        <div class="forum-modal-header">
          <h3 class="forum-modal-title">
            <i class="fas fa-user-shield"></i>
            编辑用户权限
          </h3>
          <button class="forum-modal-close" onclick="window.ForumAdminModule.closeModal('permission-edit-modal')">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="forum-modal-body">
          <div class="forum-form-group">
            <label class="forum-form-label">发帖权限</label>
            <select class="forum-form-select" id="post-restriction">
              <option value="none" ${permission.post_restriction_type === 'none' ? 'selected' : ''}>不限制</option>
              <option value="permanent" ${permission.post_restriction_type === 'permanent' ? 'selected' : ''}>永久限制</option>
              <option value="temporary" ${permission.post_restriction_type === 'temporary' ? 'selected' : ''}>限时限制</option>
            </select>
          </div>
          
          <div class="forum-form-group" id="post-duration-group" style="display: ${permission.post_restriction_type === 'temporary' ? 'block' : 'none'};">
            <label class="forum-form-label">限制时长</label>
            <select class="forum-form-select" id="post-duration">
              <option value="1">1小时</option>
              <option value="12">12小时</option>
              <option value="24">24小时</option>
            </select>
          </div>
          
          <div class="forum-form-group">
            <label class="forum-form-label">回帖权限</label>
            <select class="forum-form-select" id="reply-restriction">
              <option value="none" ${permission.reply_restriction_type === 'none' ? 'selected' : ''}>不限制</option>
              <option value="permanent" ${permission.reply_restriction_type === 'permanent' ? 'selected' : ''}>永久限制</option>
              <option value="temporary" ${permission.reply_restriction_type === 'temporary' ? 'selected' : ''}>限时限制</option>
            </select>
          </div>
          
          <div class="forum-form-group" id="reply-duration-group" style="display: ${permission.reply_restriction_type === 'temporary' ? 'block' : 'none'};">
            <label class="forum-form-label">限制时长</label>
            <select class="forum-form-select" id="reply-duration">
              <option value="1">1小时</option>
              <option value="12">12小时</option>
              <option value="24">24小时</option>
            </select>
          </div>
        </div>
        
        <div class="forum-modal-footer">
          <button class="forum-btn forum-btn-secondary" onclick="window.ForumAdminModule.closeModal('permission-edit-modal')">
            取消
          </button>
          <button class="forum-btn forum-btn-primary" onclick="window.ForumAdminModule.saveUserPermission(${userId})">
            <i class="fas fa-save"></i>
            保存
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 绑定限制类型变化事件
    document.getElementById('post-restriction').addEventListener('change', function() {
      const durationGroup = document.getElementById('post-duration-group');
      durationGroup.style.display = this.value === 'temporary' ? 'block' : 'none';
    });

    document.getElementById('reply-restriction').addEventListener('change', function() {
      const durationGroup = document.getElementById('reply-duration-group');
      durationGroup.style.display = this.value === 'temporary' ? 'block' : 'none';
    });
  }

  // 保存用户权限（修复数据格式）
  async function saveUserPermission(userId) {
    const postRestriction = document.getElementById('post-restriction').value;
    const postDuration = document.getElementById('post-duration').value;
    const replyRestriction = document.getElementById('reply-restriction').value;
    const replyDuration = document.getElementById('reply-duration').value;

    // 修复：统一数据格式
    const data = {
      post_restriction_type: postRestriction,
      reply_restriction_type: replyRestriction
    };

    if (postRestriction === 'temporary') {
      data.post_restriction_hours = parseInt(postDuration);
    }

    if (replyRestriction === 'temporary') {
      data.reply_restriction_hours = parseInt(replyDuration);
    }

    try {
      const token = localStorage.getItem('token');
      // 修复：统一API路径
      const response = await fetch(`${API_BASE}/forum/admin/permissions/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '保存失败');
      }

      closeModal('permission-edit-modal');
      
      if (typeof showSuccessMessage === 'function') {
        showSuccessMessage('权限设置已保存');
      }
      
      await loadUserPermissions();
    } catch (error) {
      console.error('保存权限失败:', error);
      if (typeof showErrorMessage === 'function') {
        showErrorMessage(error.message);
      }
    }
  }

  // 显示标签管理
  async function showTagManagement() {
    const container = document.getElementById('content-container');
    
    container.innerHTML = `
      <div class="forum-container">
        <div class="forum-header">
          <button class="forum-btn forum-btn-secondary" onclick="window.ForumAdminModule.init()">
            <i class="fas fa-arrow-left"></i>
            返回
          </button>
          <h1 class="forum-title">发帖分类管理</h1>
        </div>
        
        <div class="forum-toolbar">
          <div class="toolbar-left">
            <select class="forum-form-select" id="section-filter" style="width: 200px;">
              <option value="player">玩家交流区</option>
              <option value="qa">问答区</option>
              <option value="official">官方信息发布区</option>
            </select>
          </div>
          <div class="toolbar-right">
            <button class="forum-btn forum-btn-primary" onclick="window.ForumAdminModule.showNewTagModal()">
              <i class="fas fa-plus-circle"></i>
              添加分类
            </button>
          </div>
        </div>
        
        <div class="admin-table" id="tags-table">
          <div class="forum-loading">
            <div class="forum-spinner"></div>
          </div>
        </div>
      </div>
    `;

    await loadTags('player');

    const sectionFilter = document.getElementById('section-filter');
    if (sectionFilter) {
      sectionFilter.addEventListener('change', function() {
        loadTags(this.value);
      });
    }
  }

  // 加载标签列表（修复API路径）
  async function loadTags(section) {
    const token = localStorage.getItem('token');
    const container = document.getElementById('tags-table');
    
    try {
      // 修复：统一API路径
      const url = `${API_BASE}/forum/admin/tags?section=${section}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('加载失败');
      
      const tags = await response.json();
      renderTags(tags);
    } catch (error) {
      console.error('加载标签失败:', error);
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-circle"></i>
          <p>加载失败，请刷新重试</p>
        </div>
      `;
    }
  }

  // 渲染标签列表
  function renderTags(tags) {
    const container = document.getElementById('tags-table');
    
    if (!tags || tags.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>暂无分类标签</p>
        </div>
      `;
      return;
    }

    let html = `
      <table>
        <thead>
          <tr>
            <th width="150">预览</th>
            <th>标签名称</th>
            <th width="150">背景颜色</th>
            <th width="150">文字颜色</th>
            <th width="120">操作</th>
          </tr>
        </thead>
        <tbody>
    `;

    tags.forEach(tag => {
      html += `
        <tr data-tag-id="${tag.id}">
          <td>
            <span class="tag-preview" style="background: ${tag.tag_color}; color: ${tag.text_color};">
              ${escapeHtml(tag.tag_name)}
            </span>
          </td>
          <td>${escapeHtml(tag.tag_name)}</td>
          <td>
            <div class="color-input-group">
              <div class="color-preview" style="background: ${tag.tag_color};"></div>
              <span>${tag.tag_color}</span>
            </div>
          </td>
          <td>
            <div class="color-input-group">
              <div class="color-preview" style="background: ${tag.text_color};"></div>
              <span>${tag.text_color}</span>
            </div>
          </td>
          <td>
            <button class="forum-btn forum-btn-primary forum-btn-sm" 
                    onclick="window.ForumAdminModule.editTag(${tag.id})">
              <i class="fas fa-edit"></i>
            </button>
            <button class="forum-btn forum-btn-danger forum-btn-sm" 
                    onclick="window.ForumAdminModule.deleteTag(${tag.id})">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    container.innerHTML = html;
  }

  // 显示新建标签模态框
  function showNewTagModal() {
    const section = document.getElementById('section-filter').value;
    showTagModal(null, section);
  }

  // 编辑标签（修复API路径）
  async function editTag(tagId) {
    const token = localStorage.getItem('token');
    
    try {
      // 修复：统一API路径
      const response = await fetch(`${API_BASE}/forum/admin/tags/${tagId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('获取标签失败');
      
      const tag = await response.json();
      showTagModal(tag);
    } catch (error) {
      console.error('获取标签失败:', error);
      if (typeof showErrorMessage === 'function') {
        showErrorMessage('获取标签失败');
      }
    }
  }

  // 显示标签编辑模态框
  function showTagModal(tag = null, section = 'player') {
    const isEdit = tag !== null;
    
    const modal = document.createElement('div');
    modal.className = 'forum-modal show';
    modal.id = 'tag-edit-modal';
    
    modal.innerHTML = `
      <div class="forum-modal-content">
        <div class="forum-modal-header">
          <h3 class="forum-modal-title">
            <i class="fas fa-tag"></i>
            ${isEdit ? '编辑分类' : '添加分类'}
          </h3>
          <button class="forum-modal-close" onclick="window.ForumAdminModule.closeModal('tag-edit-modal')">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="forum-modal-body">
          <div class="forum-form-group">
            <label class="forum-form-label">标签名称</label>
            <input type="text" class="forum-form-input" id="tag-name" 
                   placeholder="请输入标签名称" maxlength="20"
                   value="${tag ? escapeHtml(tag.tag_name) : ''}">
          </div>
          
          <div class="forum-form-group">
            <label class="forum-form-label">背景颜色</label>
            <div class="color-input-wrapper">
              <input type="color" id="tag-bg-color-picker" 
                     value="${tag ? tag.tag_color : '#667eea'}">
              <div class="color-preview" id="tag-bg-preview" 
                   style="background: ${tag ? tag.tag_color : '#667eea'};"
                   onclick="document.getElementById('tag-bg-color-picker').click()">
              </div>
              <input type="text" class="forum-form-input" id="tag-bg-color" 
                     placeholder="#667eea" value="${tag ? tag.tag_color : '#667eea'}">
            </div>
          </div>
          
          <div class="forum-form-group">
            <label class="forum-form-label">文字颜色</label>
            <div class="color-input-wrapper">
              <input type="color" id="tag-text-color-picker" 
                     value="${tag ? tag.text_color : '#ffffff'}">
              <div class="color-preview" id="tag-text-preview" 
                   style="background: ${tag ? tag.text_color : '#ffffff'};"
                   onclick="document.getElementById('tag-text-color-picker').click()">
              </div>
              <input type="text" class="forum-form-input" id="tag-text-color" 
                     placeholder="#ffffff" value="${tag ? tag.text_color : '#ffffff'}">
            </div>
          </div>
          
          <div class="forum-form-group">
            <label class="forum-form-label">预览效果</label>
            <span class="tag-preview" id="tag-live-preview" 
                  style="background: ${tag ? tag.tag_color : '#667eea'}; color: ${tag ? tag.text_color : '#ffffff'};">
              ${tag ? escapeHtml(tag.tag_name) : '示例标签'}
            </span>
          </div>
        </div>
        
        <div class="forum-modal-footer">
          <button class="forum-btn forum-btn-secondary" onclick="window.ForumAdminModule.closeModal('tag-edit-modal')">
            取消
          </button>
          <button class="forum-btn forum-btn-primary" 
                  onclick="window.ForumAdminModule.saveTag(${isEdit ? tag.id : 'null'}, '${section}')">
            <i class="fas fa-save"></i>
            保存
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    setupColorPickers();
  }

  // 设置颜色选择器
  function setupColorPickers() {
    const bgPicker = document.getElementById('tag-bg-color-picker');
    const bgInput = document.getElementById('tag-bg-color');
    const bgPreview = document.getElementById('tag-bg-preview');
    
    const textPicker = document.getElementById('tag-text-color-picker');
    const textInput = document.getElementById('tag-text-color');
    const textPreview = document.getElementById('tag-text-preview');
    
    const preview = document.getElementById('tag-live-preview');
    const nameInput = document.getElementById('tag-name');

    bgPicker.addEventListener('input', function() {
      bgInput.value = this.value;
      bgPreview.style.background = this.value;
      preview.style.background = this.value;
    });

    bgInput.addEventListener('input', function() {
      if (/^#[0-9A-F]{6}$/i.test(this.value)) {
        bgPicker.value = this.value;
        bgPreview.style.background = this.value;
        preview.style.background = this.value;
      }
    });

    textPicker.addEventListener('input', function() {
      textInput.value = this.value;
      textPreview.style.background = this.value;
      preview.style.color = this.value;
    });

    textInput.addEventListener('input', function() {
      if (/^#[0-9A-F]{6}$/i.test(this.value)) {
        textPicker.value = this.value;
        textPreview.style.background = this.value;
        preview.style.color = this.value;
      }
    });

    nameInput.addEventListener('input', function() {
      preview.textContent = this.value || '示例标签';
    });
  }

  // 保存标签（修复API路径）
  async function saveTag(tagId, section) {
    const name = document.getElementById('tag-name').value.trim();
    const bgColor = document.getElementById('tag-bg-color').value;
    const textColor = document.getElementById('tag-text-color').value;

    if (!name) {
      if (typeof showErrorMessage === 'function') {
        showErrorMessage('请输入标签名称');
      }
      return;
    }

    const data = {
      section_key: section,
      tag_name: name,
      tag_color: bgColor,
      text_color: textColor
    };

    try {
      const token = localStorage.getItem('token');
      // 修复：统一API路径
      const url = tagId ? `${API_BASE}/forum/admin/tags/${tagId}` : `${API_BASE}/forum/admin/tags`;
      const method = tagId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '保存失败');
      }

      closeModal('tag-edit-modal');
      
      if (typeof showSuccessMessage === 'function') {
        showSuccessMessage('标签已保存');
      }
      
      await loadTags(section);
    } catch (error) {
      console.error('保存标签失败:', error);
      if (typeof showErrorMessage === 'function') {
        showErrorMessage(error.message);
      }
    }
  }

  // 删除标签（修复API路径）
  async function deleteTag(tagId) {
    if (!confirm('确定要删除此分类标签吗？')) return;

    try {
      const token = localStorage.getItem('token');
      // 修复：统一API路径
      const response = await fetch(`${API_BASE}/forum/admin/tags/${tagId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('删除失败');

      if (typeof showSuccessMessage === 'function') {
        showSuccessMessage('标签已删除');
      }

      const section = document.getElementById('section-filter').value;
      await loadTags(section);
    } catch (error) {
      console.error('删除标签失败:', error);
      if (typeof showErrorMessage === 'function') {
        showErrorMessage('删除失败');
      }
    }
  }

  // 关闭模态框
  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => modal.remove(), 300);
    }
  }

  // 工具函数
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // 暴露到全局
  window.ForumAdminModule = {
    init: initForumAdmin,
    showUserPermissions,
    editUserPermission,
    saveUserPermission,
    showTagManagement,
    showNewTagModal,
    editTag,
    saveTag,
    deleteTag,
    closeModal
  };

})();