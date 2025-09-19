// 消息中心模块 - Message Center Module (完整版)
(function(global) {
  'use strict';

  // 确保API_BASE_URL存在
  if (typeof window.API_BASE_URL === 'undefined') {
    window.API_BASE_URL = 'https://api.am-all.com.cn';
  }
  const API_BASE_URL = window.API_BASE_URL;

  // 当前聊天用户
  let currentChatUser = null;
  let currentConversation = [];

  // 打开消息中心 - 修复跳转问题
  function openMessageCenter() {
    // 关闭下拉菜单
    closeMessageDropdown();
    
    // 使用全局的loadPage函数
    if (typeof window.loadPage === 'function') {
      window.loadPage('message-center');
    } else {
      // 备用方案 - 直接修改hash
      window.location.hash = '#/message-center';
      // 手动触发渲染
      setTimeout(() => {
        renderMessageCenter();
      }, 100);
    }
  }

  // 渲染消息中心页面
  async function renderMessageCenter() {
    const container = document.getElementById('content-container');
    if (!container) {
      console.error('Content container not found');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      if (typeof showLoginRequired === 'function') {
        showLoginRequired('message-center');
      } else {
        container.innerHTML = `
          <div style="padding: 40px; text-align: center; color: #6c757d;">
            <i class="fas fa-lock" style="font-size: 48px; margin-bottom: 20px;"></i>
            <h3>请先登录查看消息</h3>
          </div>
        `;
      }
      return;
    }
    
    container.innerHTML = `
      <div class="message-center">
        <div class="message-center-header">
          <h1 class="message-center-title">消息中心</h1>
          <div class="message-actions">
            <button class="message-btn message-btn-primary" onclick="MessageCenter.openComposeModal()">
              <i class="fas fa-paper-plane"></i> 发送消息
            </button>
            <button class="message-btn message-btn-secondary" onclick="MessageCenter.selectAllMessages()">
              <i class="fas fa-check-square"></i> 全选
            </button>
            <button class="message-btn message-btn-danger" onclick="MessageCenter.deleteSelectedMessages()">
              <i class="fas fa-trash"></i> 删除
            </button>
          </div>
        </div>
        <div class="message-table">
          <table>
            <thead>
              <tr>
                <th width="40">
                  <input type="checkbox" id="select-all-checkbox" onchange="MessageCenter.toggleSelectAll()">
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
    
    await loadMessages();
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
      } else {
        showLoadError();
      }
    } catch (error) {
      console.error('加载消息失败:', error);
      showLoadError();
    }
  }

  // 显示加载错误
  function showLoadError() {
    const tbody = document.getElementById('message-list-body');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px; color: #dc3545;">
            <i class="fas fa-exclamation-triangle" style="font-size: 32px; margin-bottom: 10px;"></i>
            <div>加载消息失败，请稍后重试</div>
          </td>
        </tr>
      `;
    }
  }

  // 渲染消息列表
  function renderMessageList(messages) {
    const tbody = document.getElementById('message-list-body');
    if (!tbody) return;
    
    if (!messages || messages.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px; color: #6c757d;">
            <i class="fas fa-inbox" style="font-size: 32px; margin-bottom: 10px;"></i>
            <div>暂无消息</div>
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
            <a href="#" onclick="MessageCenter.viewMessage(${msg.id}); return false;" style="text-decoration: none; color: inherit;">
              ${escapeHtml(msg.title || '无标题')}
            </a>
          </td>
          <td>${escapeHtml(msg.sender_name || '系统')}</td>
          <td>${formatTime(msg.created_at)}</td>
          <td>
            <button class="message-btn message-btn-danger" onclick="MessageCenter.deleteMessage(${msg.id})" title="删除">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
    
    tbody.innerHTML = html;
  }

  // 查看消息详情
  async function viewMessage(messageId) {
    // 调用主消息模块的openMessage函数
    if (typeof window.openMessage === 'function') {
      await window.openMessage(messageId);
      // 刷新列表以更新已读状态
      setTimeout(() => {
        loadMessages();
      }, 500);
    } else {
      console.error('openMessage function not found');
    }
  }

  // 打开撰写消息弹窗
  function openComposeModal() {
    // 先清理之前的状态
    currentChatUser = null;
    
    const modal = createChatModal();
    modal.classList.add('show');
    
    // 重置标题和头像
    document.getElementById('chat-username').textContent = '发送消息';
    const avatarEl = document.getElementById('chat-avatar');
    if (avatarEl) {
      avatarEl.style.display = 'none';
    }
    
    // 显示用户搜索
    const searchArea = modal.querySelector('.user-search-area');
    searchArea.style.display = 'block';
    
    // 清空搜索框和结果
    const searchInput = modal.querySelector('.user-search-input');
    if (searchInput) {
      searchInput.value = '';
    }
    
    const searchResults = document.getElementById('user-search-results');
    if (searchResults) {
      searchResults.innerHTML = '';
      searchResults.classList.remove('show');
    }
    
    // 隐藏聊天区域
    const messagesArea = modal.querySelector('.chat-messages');
    const inputArea = modal.querySelector('.chat-input-area');
    messagesArea.style.display = 'none';
    inputArea.style.display = 'none';
    
    // 清空聊天记录
    if (messagesArea) {
      messagesArea.innerHTML = '';
    }
    
    // 清空输入框
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      chatInput.value = '';
    }
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
              <button class="chat-close" onclick="MessageCenter.closeChatModal()">&times;</button>
            </div>
            <div class="user-search-area">
              <input type="text" class="user-search-input" placeholder="输入用户名、昵称或UID搜索用户..." onkeyup="MessageCenter.searchUsers(this.value)">
              <div class="user-search-results" id="user-search-results"></div>
            </div>
            <div class="chat-messages" id="chat-messages"></div>
            <div class="chat-input-area">
              <input type="text" class="chat-input" id="chat-input" placeholder="输入消息..." onkeypress="MessageCenter.handleChatKeypress(event)">
              <button class="chat-send-btn" onclick="MessageCenter.sendMessage()">发送</button>
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
      const results = document.getElementById('user-search-results');
      if (results) {
        results.classList.remove('show');
      }
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
    if (!resultsDiv) return;
    
    if (users.length === 0) {
      resultsDiv.innerHTML = '<div style="padding: 10px; color: #6c757d;">未找到用户</div>';
    } else {
      let html = '';
      users.forEach(user => {
        const avatar = user.avatar || '/avatars/default_avatar.png';
        const nickname = escapeHtml(user.nickname || user.username);
        html += `
          <div class="user-result-item" onclick="MessageCenter.selectChatUser(${user.id}, '${nickname}', '${avatar}')">
            <img src="${avatar}" alt="" class="user-result-avatar">
            <div class="user-result-info">
              <div class="user-result-name">${nickname}</div>
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
    if (!modal) return;
    
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
    if (!messagesDiv) return;
    
    let html = '';
    
    messages.forEach(msg => {
      const isSent = msg.is_sent;
      let messageContent = '';
      
      // 检查消息类型
      if (msg.message_type === 'emoji') {
        try {
          const emojiData = JSON.parse(msg.content);
          messageContent = `<img src="${API_BASE_URL}${emojiData.emoji_path}" style="max-width: 120px; max-height: 120px;">`;
        } catch (e) {
          messageContent = escapeHtml(msg.content);
        }
      } else {
        messageContent = escapeHtml(msg.content);
      }
      
      html += `
        <div class="chat-message ${isSent ? 'sent' : 'received'}">
          <div class="message-bubble">
            ${messageContent}
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
      // 处理表情标记
      let processedContent = content;
      let message_type = 'text';
      
      // 检查是否是表情消息
      if (content.startsWith('[emoji:') && content.endsWith(']')) {
        message_type = 'emoji';
        // 提取表情信息
        const emojiMatch = content.match(/\[emoji:(\d+):(.*?)\]/);
        if (emojiMatch) {
          processedContent = JSON.stringify({
            emoji_id: emojiMatch[1],
            emoji_path: emojiMatch[2]
          });
        }
      }
      
      const response = await fetch(`${API_BASE_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient_id: currentChatUser.id,
          content: processedContent,
          message_type: message_type
        })
      });
      
      if (response.ok) {
        input.value = '';
        
        // 添加到界面
        const messagesDiv = document.getElementById('chat-messages');
        let messageHTML = '';
        
        if (message_type === 'emoji') {
          const emojiData = JSON.parse(processedContent);
          messageHTML = `
            <div class="chat-message sent">
              <div class="message-bubble">
                <img src="${API_BASE_URL}${emojiData.emoji_path}" style="max-width: 120px; max-height: 120px;">
                <div class="message-meta">刚刚</div>
              </div>
            </div>
          `;
        } else {
          messageHTML = `
            <div class="chat-message sent">
              <div class="message-bubble">
                ${escapeHtml(content)}
                <div class="message-meta">刚刚</div>
              </div>
            </div>
          `;
        }
        
        messagesDiv.insertAdjacentHTML('beforeend', messageHTML);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        
        showSuccessToast('消息已发送');
      } else {
        showErrorToast('发送失败');
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      showErrorToast('发送失败');
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

  // 打开聊天窗口（从消息列表）
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
        
        await selectChatUser(user.id, user.nickname || user.username, user.avatar || '/avatars/default_avatar.png');
      }
    } catch (error) {
      console.error('打开聊天窗口失败:', error);
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
        showSuccessToast('消息已删除');
        await loadMessages();
        // 更新未读计数
        if (typeof window.checkUnreadMessages === 'function') {
          window.checkUnreadMessages();
        }
      } else {
        showErrorToast('删除失败');
      }
    } catch (error) {
      console.error('删除消息失败:', error);
      showErrorToast('删除失败');
    }
  }

  // 批量删除选中的消息
  async function deleteSelectedMessages() {
    const checkboxes = document.querySelectorAll('.message-checkbox:checked');
    if (checkboxes.length === 0) {
      showErrorToast('请选择要删除的消息');
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
        showSuccessToast('消息已删除');
        await loadMessages();
        // 更新未读计数
        if (typeof window.checkUnreadMessages === 'function') {
          window.checkUnreadMessages();
        }
      } else {
        showErrorToast('删除失败');
      }
    } catch (error) {
      console.error('批量删除失败:', error);
      showErrorToast('删除失败');
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
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    if (selectAllCheckbox) {
      selectAllCheckbox.checked = true;
    }
  }

  // 关闭消息下拉菜单（辅助函数）
  function closeMessageDropdown() {
    const dropdowns = document.querySelectorAll('.message-dropdown, .message-dropdown-mobile');
    dropdowns.forEach(dropdown => {
      dropdown.classList.remove('show');
    });
  }

  // 工具函数
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
    if (!timestamp) return '未知时间';
    
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

  // Toast 提示函数
  function showSuccessToast(message) {
    if (typeof window.showSuccessMessage === 'function') {
      window.showSuccessMessage(message);
    } else {
      showToast(message, 'success');
    }
  }

  function showErrorToast(message) {
    if (typeof window.showErrorMessage === 'function') {
      window.showErrorMessage(message);
    } else {
      showToast(message, 'error');
    }
  }

  // 简单的Toast实现
  function showToast(message, type = 'info') {
    const toastHTML = `
      <div class="message-toast ${type}" style="
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideInRight 0.3s;
      ">
        ${message}
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', toastHTML);
    const toast = document.querySelector('.message-toast:last-child');
    
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }

  // 暴露给全局 - 使用命名空间避免冲突
  global.MessageCenter = {
    openMessageCenter,
    renderMessageCenter,
    loadMessages,
    viewMessage,
    deleteMessage,
    deleteSelectedMessages,
    toggleSelectAll,
    selectAllMessages,
    openComposeModal,
    closeChatModal,
    searchUsers,
    selectChatUser,
    sendMessage,
    handleChatKeypress,
    openChatModal
  };

  // 为了兼容性，也暴露主要函数到全局
  global.openMessageCenter = openMessageCenter;
  global.renderMessageCenter = renderMessageCenter;
  global.searchUsers = searchUsers;
  global.selectChatUser = selectChatUser;
  global.sendMessage = sendMessage;
  global.handleChatKeypress = handleChatKeypress;
  global.closeChatModal = closeChatModal;

})(window);