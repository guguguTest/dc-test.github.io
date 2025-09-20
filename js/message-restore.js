// message-complete.js - 完善的消息系统实现
// 包含所有必要功能：表情解析、样式保持、系统消息模态框等

(function(global) {
  'use strict';

  console.log('Loading complete message system...');

  // 确保API_BASE_URL存在
  window.API_BASE_URL = window.API_BASE_URL || 'https://api.am-all.com.cn';
  const API_BASE_URL = window.API_BASE_URL;

  // 全局状态管理
  const MessageState = {
    initialized: false,
    unreadCount: 0,
    currentChatUser: null,
    checkInterval: null,
    refreshInterval: null,
    isSending: false,
    lastSendTime: 0,
    currentEmojiPicker: null
  };

  // ==================== 初始化系统 ====================
  function initMessageSystem() {
    if (MessageState.initialized) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    MessageState.initialized = true;
    
    addMessageIcon();
    checkUnreadMessages();
    
    if (MessageState.checkInterval) {
      clearInterval(MessageState.checkInterval);
    }
    MessageState.checkInterval = setInterval(checkUnreadMessages, 10000);
    
    bindEvents();
    requestNotificationPermission();
  }

  // ==================== 添加消息图标 ====================
  function addMessageIcon() {
    // PC端
    const pcPlaceholder = document.getElementById('pc-message-placeholder');
    if (pcPlaceholder && !document.getElementById('message-icon-wrapper')) {
      pcPlaceholder.innerHTML = `
        <div class="message-icon-wrapper" id="message-icon-wrapper">
          <i class="fas fa-envelope message-icon"></i>
          <span class="message-badge" id="message-badge" style="display: none;">0</span>
          <div class="message-dropdown" id="message-dropdown"></div>
        </div>
      `;
    }
    
    // 移动端
    const mobilePlaceholder = document.getElementById('mobile-message-placeholder');
    if (mobilePlaceholder && !document.getElementById('message-icon-wrapper-mobile')) {
      mobilePlaceholder.innerHTML = `
        <div class="message-icon-wrapper-mobile" id="message-icon-wrapper-mobile">
          <i class="fas fa-envelope message-icon"></i>
          <span class="message-badge" id="message-badge-mobile" style="display: none;">0</span>
          <div class="message-dropdown-mobile" id="message-dropdown-mobile"></div>
        </div>
      `;
    }
  }

  // ==================== 检查未读消息 ====================
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

  // ==================== 更新未读徽章 ====================
  function updateUnreadBadge(count) {
    MessageState.unreadCount = count;
    const badges = document.querySelectorAll('#message-badge, #message-badge-mobile');
    
    badges.forEach(badge => {
      if (badge) {
        if (count > 0) {
          badge.textContent = count > 99 ? '99+' : count;
          badge.style.display = 'flex';
          badge.classList.add('badge-animate');
          setTimeout(() => badge.classList.remove('badge-animate'), 300);
        } else {
          badge.style.display = 'none';
        }
      }
    });
    
    // 更新图标颜色
    const icons = document.querySelectorAll('.message-icon');
    icons.forEach(icon => {
      if (icon) {
        icon.style.color = count > 0 ? '#dc3545' : '#6c757d';
      }
    });
  }

  // ==================== 绑定事件 ====================
  function bindEvents() {
    document.addEventListener('click', function(e) {
      const messageIcon = e.target.closest('.message-icon-wrapper, .message-icon-wrapper-mobile');
      if (messageIcon) {
        e.stopPropagation();
        e.preventDefault();
        const isMobile = messageIcon.classList.contains('message-icon-wrapper-mobile');
        toggleMessageDropdown(isMobile);
        return;
      }
      
      if (!e.target.closest('.message-dropdown, .message-dropdown-mobile')) {
        closeMessageDropdown();
      }
    });
  }

  // ==================== 消息下拉菜单 ====================
  function toggleMessageDropdown(isMobile) {
    const dropdownId = isMobile ? 'message-dropdown-mobile' : 'message-dropdown';
    const dropdown = document.getElementById(dropdownId);
    
    if (!dropdown) return;
    
    if (dropdown.classList.contains('show')) {
      closeMessageDropdown();
    } else {
      openMessageDropdown(dropdown);
    }
  }

  async function openMessageDropdown(dropdown) {
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
        renderMessageDropdown(dropdown, messages);
        dropdown.classList.add('show');
      }
    } catch (error) {
      console.error('获取消息列表失败:', error);
    }
  }

  function closeMessageDropdown() {
    const dropdowns = document.querySelectorAll('.message-dropdown, .message-dropdown-mobile');
    dropdowns.forEach(d => d.classList.remove('show'));
  }

  function renderMessageDropdown(dropdown, messages) {
    let html = `
      <div class="message-dropdown-header">
        <div class="message-dropdown-title">消息</div>
        ${MessageState.unreadCount > 0 ? `<span class="mark-all-read" onclick="markAllAsRead()">全部已读</span>` : ''}
      </div>
      <div class="message-dropdown-body">
    `;
    
    if (!messages || messages.length === 0) {
      html += `<div style="padding: 40px; text-align: center; color: #6c757d;">暂无消息</div>`;
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
              <div class="message-title">${escapeHtml(msg.title || '无标题')}</div>
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
        <a href="#" class="view-all-messages" onclick="openMessageCenter(); return false;">查看全部消息</a>
      </div>
    `;
    
    dropdown.innerHTML = html;
    
    // 绑定消息点击事件
    dropdown.querySelectorAll('.message-item').forEach(item => {
      item.addEventListener('click', function() {
        const messageId = this.getAttribute('data-message-id');
        openMessage(messageId);
      });
    });
  }

  // ==================== 创建聊天窗口 ====================
  function createChatModal() {
    const oldModal = document.getElementById('chat-modal');
    if (oldModal) oldModal.remove();
    
    const isMobile = window.innerWidth <= 768;
    
    const modalHTML = `
      <div id="chat-modal" class="chat-modal ${isMobile ? 'mobile-centered' : 'pc-draggable'} show">
        ${isMobile ? '<div class="chat-modal-overlay"></div>' : ''}
        <div class="chat-container" id="chat-container">
          <div class="chat-header" id="chat-header">
            <div class="chat-user-info">
              <img src="" alt="" class="chat-avatar" id="chat-avatar" style="display: none;">
              <div>
                <div class="chat-username" id="chat-username">发送消息</div>
              </div>
            </div>
            <button class="chat-close" id="chat-close-btn">&times;</button>
          </div>
          <div class="user-search-area" id="user-search-area">
            <input type="text" class="user-search-input" id="user-search-input" 
                   placeholder="输入用户名、昵称或UID搜索用户...">
            <div class="user-search-results" id="user-search-results"></div>
          </div>
          <div class="chat-messages" id="chat-messages" style="display: none;"></div>
          <div class="chat-input-area" id="chat-input-area" style="display: none;">
            <button class="emoji-btn" id="emoji-btn">
              <i class="far fa-smile"></i>
            </button>
            <input type="text" class="chat-input" id="chat-input" placeholder="输入消息...">
            <button class="chat-send-btn" id="chat-send-btn">发送</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    bindChatEvents();
    
    if (!isMobile) {
      setupDraggable();
    }
  }

  // ==================== 聊天事件绑定 ====================
  function bindChatEvents() {
    const closeBtn = document.getElementById('chat-close-btn');
    if (closeBtn) {
      closeBtn.onclick = closeChatModal;
    }
    
    const overlay = document.querySelector('.chat-modal-overlay');
    if (overlay) {
      overlay.onclick = closeChatModal;
    }
    
    const searchInput = document.getElementById('user-search-input');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => searchUsers(this.value), 300);
      });
    }
    
    const sendBtn = document.getElementById('chat-send-btn');
    if (sendBtn) {
      sendBtn.onclick = sendMessage;
    }
    
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          sendMessage();
        }
      });
    }
    
    // 表情按钮 - 修复版
    const emojiBtn = document.getElementById('emoji-btn');
    if (emojiBtn) {
      emojiBtn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleEmojiPicker(this);
      };
    }
  }

  // ==================== 表情选择器（修复版） ====================
  function toggleEmojiPicker(btn) {
    const chatContainer = document.getElementById('chat-container');
    if (!chatContainer) return;
    
    // 检查是否有表情选择器
    let picker = MessageState.currentEmojiPicker;
    
    if (!picker) {
      // 创建表情选择器
      if (typeof window.toggleEmojiPicker === 'function') {
        window.selectedChatInput = document.getElementById('chat-input');
        window.toggleEmojiPicker(btn);
        picker = document.querySelector('.emoji-picker');
        MessageState.currentEmojiPicker = picker;
      }
    }
    
    if (picker) {
      // 将表情选择器添加到聊天容器内
      if (!chatContainer.contains(picker)) {
        chatContainer.appendChild(picker);
      }
      
      // 设置位置（相对于聊天容器）
      picker.style.position = 'absolute';
      picker.style.bottom = '70px';
      picker.style.left = '10px';
      picker.style.right = '10px';
      picker.style.maxWidth = 'calc(100% - 20px)';
      picker.style.height = '300px';
      picker.style.zIndex = '100';
      
      // 切换显示状态
      if (picker.classList.contains('show')) {
        picker.classList.remove('show');
        btn.classList.remove('active');
      } else {
        picker.classList.add('show');
        btn.classList.add('active');
      }
    }
  }

  // ==================== 发送消息（支持表情） ====================
  async function sendMessage() {
    const now = Date.now();
    if (MessageState.isSending || (now - MessageState.lastSendTime) < 1000) {
      return;
    }
    
    const input = document.getElementById('chat-input');
    const content = input ? input.value.trim() : '';
    
    if (!content || !MessageState.currentChatUser) return;
    
    MessageState.isSending = true;
    MessageState.lastSendTime = now;
    
    const token = localStorage.getItem('token');
    if (!token) {
      MessageState.isSending = false;
      return;
    }
    
    // 清空输入框
    input.value = '';
    
    // 处理消息内容
    let processedContent = content;
    let messageType = 'text';
    let displayContent = escapeHtml(content);
    
    // 处理表情消息
    if (content.startsWith('[emoji:') && content.endsWith(']')) {
      messageType = 'emoji';
      const match = content.match(/\[emoji:(\d+):(.*?)\]/);
      if (match) {
        processedContent = JSON.stringify({
          emoji_id: match[1],
          emoji_path: match[2]
        });
        displayContent = `<img src="${API_BASE_URL}${match[2]}" style="max-width: 120px; max-height: 120px; border-radius: 8px;">`;
      }
    }
    
    // 添加临时消息显示
    const messagesDiv = document.getElementById('chat-messages');
    const tempId = 'temp_' + Date.now();
    
    if (messagesDiv) {
      const messageHTML = `
        <div class="chat-message sent" data-temp-id="${tempId}">
          <div class="message-bubble">
            ${displayContent}
            <div class="message-meta">发送中...</div>
          </div>
        </div>
      `;
      messagesDiv.insertAdjacentHTML('beforeend', messageHTML);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient_id: MessageState.currentChatUser.id,
          content: processedContent,
          message_type: messageType
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // 更新临时消息
        const tempMsg = document.querySelector(`[data-temp-id="${tempId}"]`);
        if (tempMsg) {
          tempMsg.setAttribute('data-message-id', result.id);
          tempMsg.removeAttribute('data-temp-id');
          const meta = tempMsg.querySelector('.message-meta');
          if (meta) meta.textContent = '刚刚';
        }
      } else {
        throw new Error('发送失败');
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      const tempMsg = document.querySelector(`[data-temp-id="${tempId}"]`);
      if (tempMsg) tempMsg.remove();
    } finally {
      setTimeout(() => {
        MessageState.isSending = false;
      }, 1000);
    }
  }

  // ==================== 加载和显示聊天记录 ====================
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

  function renderChatMessages(messages) {
    const messagesDiv = document.getElementById('chat-messages');
    if (!messagesDiv) return;
    
    let html = '';
    messages.forEach(msg => {
      const content = parseMessageContent(msg.content, msg.message_type);
      html += `
        <div class="chat-message ${msg.is_sent ? 'sent' : 'received'}" data-message-id="${msg.id}">
          <div class="message-bubble">
            ${content}
            <div class="message-meta">${formatTime(msg.created_at)}</div>
          </div>
        </div>
      `;
    });
    
    messagesDiv.innerHTML = html;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  // ==================== 解析消息内容（重要：处理表情） ====================
  function parseMessageContent(content, messageType) {
    // 处理表情消息
    if (messageType === 'emoji' || 
        (typeof content === 'string' && 
         (content.includes('emoji_path') || content.includes('emoji_id')))) {
      
      try {
        let emojiData;
        
        // 尝试解析JSON
        if (typeof content === 'string' && content.startsWith('{')) {
          try {
            emojiData = JSON.parse(content);
          } catch (e) {
            // 如果解析失败，尝试提取路径
            const match = content.match(/"emoji_path":"([^"]+)"/);
            if (match && match[1]) {
              emojiData = { emoji_path: match[1] };
            }
          }
        } else if (typeof content === 'object') {
          emojiData = content;
        }
        
        // 渲染表情图片
        if (emojiData && emojiData.emoji_path) {
          let emojiPath = emojiData.emoji_path;
          if (!emojiPath.startsWith('http')) {
            if (!emojiPath.startsWith('/')) {
              emojiPath = '/' + emojiPath;
            }
            emojiPath = API_BASE_URL + emojiPath;
          }
          return `<img src="${emojiPath}" style="max-width: 120px; max-height: 120px; vertical-align: middle; border-radius: 8px;" alt="表情">`;
        }
      } catch (e) {
        console.error('解析表情消息失败:', e);
      }
    }
    
    // 处理普通文本中的表情标记
    if (typeof content === 'string' && content.includes('[emoji:')) {
      content = content.replace(/\[emoji:(\d+):(.*?)\]/g, function(match, id, path) {
        const fullPath = API_BASE_URL + path;
        return `<img src="${fullPath}" style="max-width: 120px; max-height: 120px; vertical-align: middle; border-radius: 8px;" alt="表情">`;
      });
      return content;
    }
    
    // 默认返回转义的文本
    return escapeHtml(content);
  }

  // ==================== 系统消息模态框 ====================
  function showSystemMessage(message) {
    const oldModal = document.getElementById('system-message-modal');
    if (oldModal) oldModal.remove();
    
    const modalHTML = `
      <div class="modal show" id="system-message-modal" style="display: flex !important;">
        <div class="modal-content system-message-detail" style="max-width: 600px;">
          <div class="modal-header system-message-header">
            <div class="system-message-header-content">
              <h5 class="system-message-title">${escapeHtml(message.title || '系统消息')}</h5>
              <div class="system-message-meta">
                <span class="message-type-badge ${message.message_type}">
                  <i class="fas ${getMessageTypeIcon(message.message_type)} me-1"></i>
                  ${getMessageTypeLabel(message.message_type)}
                </span>
                <span class="message-date">
                  <i class="fas fa-clock me-1"></i>
                  ${formatTime(message.created_at)}
                </span>
              </div>
            </div>
            <button type="button" class="modal-close" onclick="closeSystemMessage()">&times;</button>
          </div>
          <div class="modal-body system-message-body">
            <div class="message-content-box">
              <div class="message-content-text">
                ${escapeHtml(message.content)}
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ok" onclick="closeSystemMessage()">
              <i class="fas fa-check me-2"></i>
              我知道了
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  function closeSystemMessage() {
    const modal = document.getElementById('system-message-modal');
    if (modal) modal.remove();
  }

  // ==================== 打开消息详情 ====================
  async function openMessage(messageId) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      // 标记已读
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
        
        closeMessageDropdown();
        
        if (message.message_type === 'user') {
          openChatModal(message.sender_id);
        } else {
          showSystemMessage(message);
        }
        
        checkUnreadMessages();
      }
    } catch (error) {
      console.error('打开消息失败:', error);
    }
  }

  // ==================== 其他功能函数 ====================
  function openChatModal(userId) {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('请先登录');
      return;
    }
    
    createChatModal();
    
    if (userId) {
      fetch(`${API_BASE_URL}/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).then(response => response.json()).then(user => {
        selectChatUser(user.id, user.nickname || user.username, user.avatar);
      }).catch(error => {
        console.error('获取用户信息失败:', error);
      });
    }
  }

  function closeChatModal() {
    const modal = document.getElementById('chat-modal');
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => modal.remove(), 300);
    }
    
    // 清理表情选择器
    if (MessageState.currentEmojiPicker) {
      MessageState.currentEmojiPicker.remove();
      MessageState.currentEmojiPicker = null;
    }
    
    MessageState.currentChatUser = null;
    if (MessageState.refreshInterval) {
      clearInterval(MessageState.refreshInterval);
      MessageState.refreshInterval = null;
    }
  }

  function selectChatUser(userId, username, avatar) {
    MessageState.currentChatUser = { id: userId, username, avatar };
    
    document.getElementById('user-search-area').style.display = 'none';
    document.getElementById('chat-messages').style.display = 'block';
    document.getElementById('chat-input-area').style.display = 'flex';
    document.getElementById('chat-username').textContent = username;
    
    const avatarEl = document.getElementById('chat-avatar');
    if (avatarEl) {
      avatarEl.src = avatar || '/avatars/default_avatar.png';
      avatarEl.style.display = 'block';
    }
    
    loadChatHistory(userId);
  }

  async function searchUsers(query) {
    if (!query || query.length < 2) {
      const results = document.getElementById('user-search-results');
      if (results) results.classList.remove('show');
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

  function renderUserSearchResults(users) {
    const resultsDiv = document.getElementById('user-search-results');
    if (!resultsDiv) return;
    
    if (users.length === 0) {
      resultsDiv.innerHTML = '<div style="padding: 10px;">未找到用户</div>';
    } else {
      let html = '';
      users.forEach(user => {
        html += `
          <div class="user-result-item" onclick="selectChatUser(${user.id}, '${escapeHtml(user.nickname || user.username)}', '${user.avatar || '/avatars/default_avatar.png'}')">
            <img src="${user.avatar || '/avatars/default_avatar.png'}" alt="" class="user-result-avatar">
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
        closeMessageDropdown();
      }
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  }

  function openMessageCenter() {
    closeMessageDropdown();
    if (typeof window.loadPage === 'function') {
      window.loadPage('message-center');
    }
  }

  function setupDraggable() {
    const container = document.querySelector('.chat-container');
    const header = document.querySelector('.chat-header');
    
    if (!container || !header) return;
    
    container.style.position = 'fixed';
    container.style.top = '50%';
    container.style.left = '50%';
    container.style.transform = 'translate(-50%, -50%)';
    
    let isDragging = false;
    let currentX = 0, currentY = 0;
    let initialX = 0, initialY = 0;
    let xOffset = 0, yOffset = 0;
    
    header.style.cursor = 'move';
    
    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
    
    function dragStart(e) {
      if (e.target.tagName === 'BUTTON') return;
      
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
      isDragging = true;
    }
    
    function drag(e) {
      if (!isDragging) return;
      
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      xOffset = currentX;
      yOffset = currentY;
      
      container.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px))`;
    }
    
    function dragEnd() {
      isDragging = false;
    }
  }

  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  // ==================== 工具函数 ====================
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

  // ==================== 暴露全局API ====================
  global.initMessageSystem = initMessageSystem;
  global.openChatModal = openChatModal;
  global.closeChatModal = closeChatModal;
  global.sendMessage = sendMessage;
  global.selectChatUser = selectChatUser;
  global.searchUsers = searchUsers;
  global.openMessage = openMessage;
  global.openMessageCenter = openMessageCenter;
  global.checkUnreadMessages = checkUnreadMessages;
  global.markAllAsRead = markAllAsRead;
  global.showSystemMessage = showSystemMessage;
  global.closeSystemMessage = closeSystemMessage;
  
  // 兼容好友系统
  global.openChatWithFriend = function(friendId) {
    openChatModal(friendId);
  };

  // ==================== 自动初始化 ====================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initMessageSystem, 100);
    });
  } else {
    setTimeout(initMessageSystem, 100);
  }
  
  // 监听登录状态
  setInterval(() => {
    const token = localStorage.getItem('token');
    if (token && !MessageState.initialized) {
      initMessageSystem();
    } else if (!token && MessageState.initialized) {
      MessageState.initialized = false;
      if (MessageState.checkInterval) {
        clearInterval(MessageState.checkInterval);
      }
    }
  }, 2000);

  console.log('Complete message system loaded');

})(window);