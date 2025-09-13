// 消息系统JavaScript
(function(global) {
  'use strict';

  // 确保API_BASE_URL存在
  if (typeof window.API_BASE_URL === 'undefined') {
    window.API_BASE_URL = 'https://api.am-all.com.cn';
  }
  const API_BASE_URL = window.API_BASE_URL;

  let unreadCount = 0;
  let currentChatUser = null;
  let messageCheckInterval = null;
  let currentConversation = [];

  // 初始化消息系统
  function initMessageSystem() {
    // 添加消息图标到导航栏
    addMessageIconToNavbar();
    
    // 检查未读消息
    checkUnreadMessages();
    
    // 设置定时检查
    messageCheckInterval = setInterval(checkUnreadMessages, 30000); // 每30秒检查一次
    
    // 绑定事件
    bindMessageEvents();
  }

  // 添加消息图标到导航栏
  function addMessageIconToNavbar() {
    const navbarRight = document.querySelector('.navbar-right');
    
    if (!navbarRight) return;
    
    // 检查是否已存在
    if (document.getElementById('message-icon-wrapper')) return;
    
    // PC端消息图标
    const messageIconHTML = `
      <div class="message-icon-wrapper" id="message-icon-wrapper">
        <i class="fas fa-envelope message-icon"></i>
        <span class="message-badge" id="message-badge" style="display: none;">0</span>
        <div class="message-dropdown" id="message-dropdown"></div>
      </div>
    `;
    
    // 移动端消息图标
    const mobileMessageIconHTML = `
      <div class="message-icon-wrapper-mobile" id="message-icon-wrapper-mobile">
        <i class="fas fa-envelope message-icon"></i>
        <span class="message-badge" id="message-badge-mobile" style="display: none;">0</span>
        <div class="message-dropdown-mobile" id="message-dropdown-mobile"></div>
      </div>
    `;
    
    // PC端添加到右侧
    const userArea = navbarRight.querySelector('.user-area-container');
    if (userArea) {
      userArea.insertAdjacentHTML('afterbegin', messageIconHTML);
    }
    
    // 移动端添加到导航栏中间（标题前）
    const navbarCenter = document.querySelector('.navbar-center');
    if (navbarCenter) {
      navbarCenter.insertAdjacentHTML('afterbegin', mobileMessageIconHTML);
    }
  }

  // 检查未读消息
  async function checkUnreadMessages() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        updateUnreadBadge(data.count || 0);
      }
    } catch (error) {
      console.error('获取未读消息失败:', error);
    }
  }

  // 更新未读消息徽章
  function updateUnreadBadge(count) {
    unreadCount = count;
    const badge = document.getElementById('message-badge');
    const mobileBadge = document.getElementById('message-badge-mobile');
    
    [badge, mobileBadge].forEach(b => {
      if (b) {
        if (count > 0) {
          b.textContent = count > 99 ? '99+' : count;
          b.style.display = 'flex';
        } else {
          b.style.display = 'none';
        }
      }
    });
  }

  // 绑定消息事件
  function bindMessageEvents() {
    // 点击消息图标
    document.addEventListener('click', function(e) {
      // PC端消息图标
      const wrapper = e.target.closest('.message-icon-wrapper');
      if (wrapper) {
        e.stopPropagation();
        toggleMessageDropdown('desktop');
        return;
      }
      
      // 移动端消息图标
      const mobileWrapper = e.target.closest('.message-icon-wrapper-mobile');
      if (mobileWrapper) {
        e.stopPropagation();
        toggleMessageDropdown('mobile');
        return;
      }
      
      // 点击其他地方关闭下拉菜单
      if (!e.target.closest('.message-dropdown') && !e.target.closest('.message-dropdown-mobile')) {
        closeMessageDropdown();
      }
    });
  }

  // 切换消息下拉菜单
  function toggleMessageDropdown(type = 'desktop') {
    const dropdownId = type === 'mobile' ? 'message-dropdown-mobile' : 'message-dropdown';
    const dropdown = document.getElementById(dropdownId);
    
    if (!dropdown) return;
    
    if (dropdown.classList.contains('show')) {
      closeMessageDropdown();
    } else {
      openMessageDropdown(type);
    }
  }

  // 打开消息下拉菜单
  async function openMessageDropdown(type = 'desktop') {
    const dropdownId = type === 'mobile' ? 'message-dropdown-mobile' : 'message-dropdown';
    const dropdown = document.getElementById(dropdownId);
    
    if (!dropdown) return;
    
    const token = localStorage.getItem('token');
    
    if (!token) {
      dropdown.innerHTML = `
        <div class="message-dropdown-header">
          <div class="message-dropdown-title">消息</div>
        </div>
        <div style="padding: 40px; text-align: center; color: #6c757d;">
          请先登录查看消息
        </div>
      `;
      dropdown.classList.add('show');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/recent`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const messages = await response.json();
        renderMessageDropdown(messages, type);
        dropdown.classList.add('show');
      }
    } catch (error) {
      console.error('获取消息列表失败:', error);
    }
  }

  // 渲染消息下拉菜单
  function renderMessageDropdown(messages, type = 'desktop') {
    const dropdownId = type === 'mobile' ? 'message-dropdown-mobile' : 'message-dropdown';
    const dropdown = document.getElementById(dropdownId);
    
    if (!dropdown) return;
    
    let html = `
      <div class="message-dropdown-header">
        <div class="message-dropdown-title">消息</div>
        ${unreadCount > 0 ? `<span class="mark-all-read" data-action="mark-all-read">全部已读</span>` : ''}
      </div>
      <div class="message-dropdown-body">
    `;
    
    if (!messages || messages.length === 0) {
      html += `
        <div style="padding: 40px; text-align: center; color: #6c757d;">
          暂无消息
        </div>
      `;
    } else {
      messages.forEach(msg => {
        const typeIcon = getMessageTypeIcon(msg.message_type);
        const isUnread = !msg.is_read;
        
        html += `
          <div class="message-item ${isUnread ? 'unread' : ''}" data-message-id="${msg.id}">
            <div class="message-type-icon ${msg.message_type}">
              <i class="fas ${typeIcon}"></i>
            </div>
            <div class="message-content-wrapper">
              <div class="message-title">${escapeHtml(msg.title)}</div>
              <div class="message-preview">${escapeHtml((msg.content || '').substring(0, 50))}...</div>
              <div class="message-time">${formatTime(msg.created_at)}</div>
            </div>
          </div>
        `;
      });
    }
    
    html += `
      </div>
      <div class="message-dropdown-footer">
        <a href="#" class="view-all-messages" data-action="view-all">查看全部消息</a>
      </div>
    `;
    
    dropdown.innerHTML = html;
    
    // 绑定事件（使用事件委托）
    dropdown.addEventListener('click', handleDropdownClick);
  }

  // 处理下拉菜单点击事件
  function handleDropdownClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // 查看全部消息
    if (e.target.closest('[data-action="view-all"]')) {
      openMessageCenter();
      return;
    }
    
    // 全部已读
    if (e.target.closest('[data-action="mark-all-read"]')) {
      markAllAsRead();
      return;
    }
    
    // 点击消息项
    const messageItem = e.target.closest('.message-item');
    if (messageItem) {
      const messageId = messageItem.getAttribute('data-message-id');
      if (messageId) {
        openMessage(messageId);
      }
    }
  }

  // 关闭消息下拉菜单
  function closeMessageDropdown() {
    const dropdowns = document.querySelectorAll('.message-dropdown, .message-dropdown-mobile');
    dropdowns.forEach(dropdown => {
      dropdown.classList.remove('show');
    });
  }

  // 标记所有消息为已读
  async function markAllAsRead() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        updateUnreadBadge(0);
        // 重新加载下拉菜单
        const desktopDropdown = document.getElementById('message-dropdown');
        const mobileDropdown = document.getElementById('message-dropdown-mobile');
        
        if (desktopDropdown && desktopDropdown.classList.contains('show')) {
          openMessageDropdown('desktop');
        }
        if (mobileDropdown && mobileDropdown.classList.contains('show')) {
          openMessageDropdown('mobile');
        }
        
        if (typeof showSuccessMessage === 'function') {
          showSuccessMessage('所有消息已标记为已读');
        }
      }
    } catch (error) {
      console.error('标记已读失败:', error);
      if (typeof showErrorMessage === 'function') {
        showErrorMessage('操作失败');
      }
    }
  }

  // 打开消息
  async function openMessage(messageId) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      // 标记为已读
      await fetch(`${API_BASE_URL}/api/messages/${messageId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // 获取消息详情
      const response = await fetch(`${API_BASE_URL}/api/messages/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const message = await response.json();
        
        // 根据消息类型处理
        if (message.message_type === 'user') {
          openChatModal(message.sender_id);
        } else {
          showSystemMessage(message);
        }
        
        // 更新未读计数
        checkUnreadMessages();
      }
    } catch (error) {
      console.error('打开消息失败:', error);
    }
  }

  // 打开消息中心 - 修复跳转问题
  function openMessageCenter() {
    closeMessageDropdown();
    
    // 使用全局的loadPage函数
    if (typeof window.loadPage === 'function') {
      window.loadPage('message-center');
    } else {
      // 备用方案
      window.location.hash = '#/message-center';
    }
  }

  // 渲染消息中心页面
  async function renderMessageCenter() {
    const container = document.getElementById('content-container');
    if (!container) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      if (typeof showLoginRequired === 'function') {
        showLoginRequired('message-center');
      }
      return;
    }
    
    container.innerHTML = `
      <div class="message-center">
        <div class="message-center-header">
          <h1 class="message-center-title">消息中心</h1>
          <div class="message-actions">
            <button class="message-btn message-btn-primary" onclick="openComposeModal()">
              <i class="fas fa-paper-plane"></i> 发送消息
            </button>
            <button class="message-btn message-btn-secondary" onclick="selectAllMessages()">
              <i class="fas fa-check-square"></i> 全选
            </button>
            <button class="message-btn message-btn-danger" onclick="deleteSelectedMessages()">
              <i class="fas fa-trash"></i> 删除
            </button>
          </div>
        </div>
        <div class="message-table">
          <table>
            <thead>
              <tr>
                <th width="40">
                  <input type="checkbox" id="select-all-checkbox" onchange="toggleSelectAll()">
                </th>
                <th width="100">类型</th>
                <th>标题</th>
                <th width="150">发送者</th>
                <th width="150">时间</th>
                <th width="100">操作</th>
              </tr>
            </thead>
            <tbody id="message-list-body">
              <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                  <i class="fas fa-spinner fa-spin"></i> 加载中...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    loadMessages();
  }

  // 加载消息列表
  async function loadMessages() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const messages = await response.json();
        renderMessageList(messages);
      }
    } catch (error) {
      console.error('加载消息失败:', error);
      if (typeof showErrorMessage === 'function') {
        showErrorMessage('加载消息失败');
      }
    }
  }

  // 渲染消息列表
  function renderMessageList(messages) {
    const tbody = document.getElementById('message-list-body');
    if (!tbody) return;
    
    if (messages.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px; color: #6c757d;">
            暂无消息
          </td>
        </tr>
      `;
      return;
    }
    
    let html = '';
    messages.forEach(msg => {
      const typeLabel = getMessageTypeLabel(msg.message_type);
      const isUnread = !msg.is_read;
      
      html += `
        <tr class="${isUnread ? 'unread' : ''}" data-message-id="${msg.id}">
          <td>
            <input type="checkbox" class="message-checkbox" value="${msg.id}">
          </td>
          <td>
            <span class="message-type-badge ${msg.message_type}">${typeLabel}</span>
          </td>
          <td>
            <a href="#" onclick="openMessage(${msg.id}); return false;">
              ${escapeHtml(msg.title)}
            </a>
          </td>
          <td>${escapeHtml(msg.sender_name || '系统')}</td>
          <td>${formatTime(msg.created_at)}</td>
          <td>
            <button class="message-btn message-btn-danger" onclick="deleteMessage(${msg.id})">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
    
    tbody.innerHTML = html;
  }

  // 打开撰写消息弹窗
  function openComposeModal() {
    const modal = createChatModal();
    modal.classList.add('show');
    
    // 显示用户搜索
    const searchArea = modal.querySelector('.user-search-area');
    searchArea.style.display = 'block';
    
    // 隐藏聊天区域
    const messagesArea = modal.querySelector('.chat-messages');
    const inputArea = modal.querySelector('.chat-input-area');
    messagesArea.style.display = 'none';
    inputArea.style.display = 'none';
  }

  // 创建聊天模态框
  function createChatModal() {
    let modal = document.getElementById('chat-modal');
    if (!modal) {
      const modalHTML = `
        <div id="chat-modal" class="chat-modal">
          <div class="chat-container">
            <div class="chat-header">
              <div class="chat-user-info">
                <img src="" alt="" class="chat-avatar" id="chat-avatar" style="display: none;">
                <div>
                  <div class="chat-username" id="chat-username">发送消息</div>
                </div>
              </div>
              <button class="chat-close" onclick="closeChatModal()">&times;</button>
            </div>
            <div class="user-search-area">
              <input type="text" class="user-search-input" placeholder="输入用户名、昵称或UID搜索用户..." onkeyup="searchUsers(this.value)">
              <div class="user-search-results" id="user-search-results"></div>
            </div>
            <div class="chat-messages" id="chat-messages"></div>
            <div class="chat-input-area">
              <input type="text" class="chat-input" id="chat-input" placeholder="输入消息..." onkeypress="handleChatKeypress(event)">
              <button class="chat-send-btn" onclick="sendMessage()">发送</button>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      modal = document.getElementById('chat-modal');
    }
    return modal;
  }

  // 搜索用户
  async function searchUsers(query) {
    if (query.length < 2) {
      document.getElementById('user-search-results').classList.remove('show');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const users = await response.json();
        renderUserSearchResults(users);
      }
    } catch (error) {
      console.error('搜索用户失败:', error);
    }
  }

  // 渲染用户搜索结果
  function renderUserSearchResults(users) {
    const resultsDiv = document.getElementById('user-search-results');
    
    if (users.length === 0) {
      resultsDiv.innerHTML = '<div style="padding: 10px; color: #6c757d;">未找到用户</div>';
    } else {
      let html = '';
      users.forEach(user => {
        html += `
          <div class="user-result-item" onclick="selectChatUser(${user.id}, '${escapeHtml(user.nickname || user.username)}', '${user.avatar}')">
            <img src="${user.avatar}" alt="" class="user-result-avatar">
            <div class="user-result-info">
              <div class="user-result-name">${escapeHtml(user.nickname || user.username)}</div>
              <div class="user-result-uid">UID: ${user.uid}</div>
            </div>
          </div>
        `;
      });
      resultsDiv.innerHTML = html;
    }
    
    resultsDiv.classList.add('show');
  }

  // 选择聊天用户
  async function selectChatUser(userId, username, avatar) {
    currentChatUser = { id: userId, username, avatar };
    
    // 更新界面
    const modal = document.getElementById('chat-modal');
    modal.querySelector('.user-search-area').style.display = 'none';
    modal.querySelector('.chat-messages').style.display = 'block';
    modal.querySelector('.chat-input-area').style.display = 'flex';
    
    document.getElementById('chat-username').textContent = username;
    const avatarEl = document.getElementById('chat-avatar');
    avatarEl.src = avatar;
    avatarEl.style.display = 'block';
    
    // 加载聊天记录
    await loadChatHistory(userId);
  }

  // 打开聊天窗口
  async function openChatModal(userId) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      // 获取用户信息
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const user = await response.json();
        const modal = createChatModal();
        modal.classList.add('show');
        
        selectChatUser(user.id, user.nickname || user.username, user.avatar);
      }
    } catch (error) {
      console.error('打开聊天窗口失败:', error);
    }
  }

  // 加载聊天记录
  async function loadChatHistory(userId) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/conversation/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const messages = await response.json();
        renderChatMessages(messages);
      }
    } catch (error) {
      console.error('加载聊天记录失败:', error);
    }
  }

  // 渲染聊天消息
  function renderChatMessages(messages) {
    const messagesDiv = document.getElementById('chat-messages');
    let html = '';
    
    messages.forEach(msg => {
      const isSent = msg.is_sent;
      html += `
        <div class="chat-message ${isSent ? 'sent' : 'received'}">
          <div class="message-bubble">
            ${escapeHtml(msg.content)}
            <div class="message-meta">${formatTime(msg.created_at)}</div>
          </div>
        </div>
      `;
    });
    
    messagesDiv.innerHTML = html;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  // 发送消息
  async function sendMessage() {
    const input = document.getElementById('chat-input');
    const content = input.value.trim();
    
    if (!content || !currentChatUser) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient_id: currentChatUser.id,
          content: content,
          message_type: 'user'
        })
      });
      
      if (response.ok) {
        input.value = '';
        
        // 添加到界面
        const messagesDiv = document.getElementById('chat-messages');
        const messageHTML = `
          <div class="chat-message sent">
            <div class="message-bubble">
              ${escapeHtml(content)}
              <div class="message-meta">刚刚</div>
            </div>
          </div>
        `;
        messagesDiv.insertAdjacentHTML('beforeend', messageHTML);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      if (typeof showErrorMessage === 'function') {
        showErrorMessage('发送失败');
      }
    }
  }

  // 处理聊天输入框回车
  function handleChatKeypress(event) {
    if (event.key === 'Enter') {
      sendMessage();
    }
  }

  // 关闭聊天模态框
  function closeChatModal() {
    const modal = document.getElementById('chat-modal');
    if (modal) {
      modal.classList.remove('show');
      currentChatUser = null;
    }
  }

  // 显示系统消息
  function showSystemMessage(message) {
    const modalHTML = `
      <div class="modal show" id="system-message-modal">
        <div class="modal-content" style="max-width: 600px;">
          <div class="modal-header">
            <h5>${escapeHtml(message.title)}</h5>
            <button type="button" class="modal-close" onclick="closeSystemMessageModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <img src="${message.sender_avatar || '/avatars/default_avatar.png'}" alt="" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 12px;">
              <div>
                <div style="font-weight: 500;">${escapeHtml(message.sender_name || '系统')}</div>
                <div style="font-size: 12px; color: #6c757d;">${formatTime(message.created_at)}</div>
              </div>
            </div>
            <div style="padding: 15px; background: #f8f9fa; border-radius: 8px;">
              ${escapeHtml(message.content)}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ok" onclick="closeSystemMessageModal()">确定</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  // 关闭系统消息模态框
  function closeSystemMessageModal() {
    const modal = document.getElementById('system-message-modal');
    if (modal) {
      modal.remove();
    }
  }

  // 删除消息
  async function deleteMessage(messageId) {
    if (!confirm('确定要删除这条消息吗？')) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        if (typeof showSuccessMessage === 'function') {
          showSuccessMessage('消息已删除');
        }
        loadMessages();
        checkUnreadMessages();
      }
    } catch (error) {
      console.error('删除消息失败:', error);
      if (typeof showErrorMessage === 'function') {
        showErrorMessage('删除失败');
      }
    }
  }

  // 删除选中的消息
  async function deleteSelectedMessages() {
    const checkboxes = document.querySelectorAll('.message-checkbox:checked');
    if (checkboxes.length === 0) {
      if (typeof showErrorMessage === 'function') {
        showErrorMessage('请选择要删除的消息');
      }
      return;
    }
    
    if (!confirm(`确定要删除选中的 ${checkboxes.length} 条消息吗？`)) return;
    
    const messageIds = Array.from(checkboxes).map(cb => cb.value);
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/batch-delete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message_ids: messageIds })
      });
      
      if (response.ok) {
        if (typeof showSuccessMessage === 'function') {
          showSuccessMessage('消息已删除');
        }
        loadMessages();
        checkUnreadMessages();
      }
    } catch (error) {
      console.error('批量删除失败:', error);
      if (typeof showErrorMessage === 'function') {
        showErrorMessage('删除失败');
      }
    }
  }

  // 全选/取消全选
  function toggleSelectAll() {
    const selectAll = document.getElementById('select-all-checkbox');
    const checkboxes = document.querySelectorAll('.message-checkbox');
    checkboxes.forEach(cb => cb.checked = selectAll.checked);
  }

  // 选择所有消息
  function selectAllMessages() {
    const checkboxes = document.querySelectorAll('.message-checkbox');
    checkboxes.forEach(cb => cb.checked = true);
    document.getElementById('select-all-checkbox').checked = true;
  }

  // 工具函数
  function getMessageTypeIcon(type) {
    const icons = {
      'user': 'fa-user',
      'system': 'fa-cog',
      'notification': 'fa-bell',
      'auto': 'fa-robot'
    };
    return icons[type] || 'fa-envelope';
  }

  function getMessageTypeLabel(type) {
    const labels = {
      'user': '用户消息',
      'system': '系统消息',
      'notification': '通知',
      'auto': '自动消息'
    };
    return labels[type] || '未知';
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = (now - date) / 1000;
    
    if (diff < 60) return '刚刚';
    if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
    if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
    if (diff < 2592000) return Math.floor(diff / 86400) + '天前';
    
    return date.toLocaleDateString();
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 暴露给全局
  global.initMessageSystem = initMessageSystem;
  global.renderMessageCenter = renderMessageCenter;
  global.openMessage = openMessage;
  global.markAllAsRead = markAllAsRead;
  global.openMessageCenter = openMessageCenter;
  global.openComposeModal = openComposeModal;
  global.searchUsers = searchUsers;
  global.selectChatUser = selectChatUser;
  global.sendMessage = sendMessage;
  global.handleChatKeypress = handleChatKeypress;
  global.closeChatModal = closeChatModal;
  global.closeSystemMessageModal = closeSystemMessageModal;
  global.deleteMessage = deleteMessage;
  global.deleteSelectedMessages = deleteSelectedMessages;
  global.toggleSelectAll = toggleSelectAll;
  global.selectAllMessages = selectAllMessages;
  
  // 在DOM加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMessageSystem);
  } else {
    setTimeout(initMessageSystem, 100);
  }

})(window);