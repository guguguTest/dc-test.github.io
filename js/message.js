// message.js - 完善的消息系统实现（包含实时更新优化）
// 包含所有必要功能：表情解析、样式保持、系统消息模态框、心跳机制、消息轮询

(function(global) {
  'use strict';

  console.log('Loading complete message system with real-time features...');

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
    chatRefreshInterval: null,  // 聊天消息刷新定时器
    heartbeatInterval: null,     // 心跳定时器
    isSending: false,
    lastSendTime: 0,
    currentEmojiPicker: null,
    emojiPacksLoaded: false,
    lastMessageId: null,         // 记录最后一条消息ID
    loadedMessages: new Map(),   // 存储已加载的消息
    messageCheckInterval: null    // 消息检查定时器
  };

  // ==================== 初始化系统 ====================
  function initMessageSystem() {
    if (MessageState.initialized) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    MessageState.initialized = true;
    
    addMessageIcon();
    checkUnreadMessages();
    startHeartbeat();  // 启动心跳
    
    if (MessageState.checkInterval) {
      clearInterval(MessageState.checkInterval);
    }
    MessageState.checkInterval = setInterval(checkUnreadMessages, 10000);
    
    bindEvents();
    requestNotificationPermission();
    
    // 预加载表情包数据
    preloadEmojiPacks();
  }

  // ==================== 心跳机制 ====================
  function startHeartbeat() {
    if (MessageState.heartbeatInterval) {
      clearInterval(MessageState.heartbeatInterval);
    }
    
    const sendHeartbeat = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
        await fetch(`${API_BASE_URL}/api/heartbeat`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('Heartbeat failed:', error);
      }
    };
    
    sendHeartbeat(); // 立即发送一次
    MessageState.heartbeatInterval = setInterval(sendHeartbeat, 30000); // 每30秒发送一次
  }

  // 预加载表情包
  async function preloadEmojiPacks() {
    if (MessageState.emojiPacksLoaded) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/emoji/packs`);
      if (response.ok) {
        window.emojiPacks = await response.json();
        MessageState.emojiPacksLoaded = true;
      }
    } catch (error) {
      console.error('预加载表情包失败:', error);
    }
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
                <div class="chat-user-status" id="chat-user-status" style="display: none;">
                  <span class="status-indicator"></span>
                  <span class="status-text">离线</span>
                </div>
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
    
    // 表情按钮
    const emojiBtn = document.getElementById('emoji-btn');
    if (emojiBtn) {
      emojiBtn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleEmojiPicker(this);
      };
    }
    
    // 监听滚动事件
    const messagesDiv = document.getElementById('chat-messages');
    if (messagesDiv) {
      messagesDiv.addEventListener('scroll', function() {
        // 如果滚动到底部，移除新消息提示
        if (this.scrollHeight - this.scrollTop < this.clientHeight + 100) {
          const indicator = this.querySelector('.new-message-indicator');
          if (indicator) {
            indicator.remove();
          }
        }
      });
    }
  }

  // ==================== 表情选择器 ====================
  function toggleEmojiPicker(btn) {
    const chatContainer = document.getElementById('chat-container');
    if (!chatContainer) return;
    
    // 设置全局选中的输入框
    window.selectedChatInput = document.getElementById('chat-input');
    
    // 检查是否有表情选择器
    let picker = MessageState.currentEmojiPicker;
    
    // 如果没有选择器，创建一个
    if (!picker) {
      picker = createEmojiPicker();
      chatContainer.appendChild(picker);
      MessageState.currentEmojiPicker = picker;
      
      // 设置位置（相对于聊天容器）
      picker.style.position = 'absolute';
      picker.style.bottom = '70px'; // 在输入区域上方
      picker.style.left = '10px';
      picker.style.right = '10px';
      picker.style.maxWidth = 'calc(100% - 20px)';
      picker.style.height = '300px';
      picker.style.zIndex = '100';
      picker.style.background = 'white';
      picker.style.borderRadius = '12px';
      picker.style.boxShadow = '0 -4px 12px rgba(0,0,0,0.1)';
      picker.style.border = '1px solid #e4e6eb';
      picker.style.display = 'none';
      picker.style.flexDirection = 'column';
      
      // 确保预加载的表情包数据
      if (!MessageState.emojiPacksLoaded) {
        loadEmojiPacksForPicker();
      } else {
        updatePickerTabs();
        // 加载第一个表情包
        if (window.emojiPacks && window.emojiPacks.length > 0) {
          loadEmojiPackContent(window.emojiPacks[0].id);
        }
      }
    }
    
    // 切换显示状态
    if (picker.style.display === 'flex') {
      picker.style.display = 'none';
      btn.classList.remove('active');
    } else {
      picker.style.display = 'flex';
      btn.classList.add('active');
      // 如果有表情包，检查是否需要加载
      if (window.emojiPacks && window.emojiPacks.length > 0) {
        const emojiGrid = picker.querySelector('.emoji-grid');
        // 只有当网格不存在或为空时才加载
        if (!emojiGrid || !emojiGrid.children.length) {
          loadEmojiPackContent(window.emojiPacks[0].id);
        }
      }
    }
  }

  // 创建表情选择器
  function createEmojiPicker() {
    const picker = document.createElement('div');
    picker.className = 'emoji-picker chat-emoji-picker';
    picker.innerHTML = `
      <div class="emoji-grid-container">
        <div class="emoji-loading">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
      </div>
      <div class="emoji-tabs">
        <button class="emoji-tab recent-tab" data-tab="recent" title="最近使用">
          <i class="far fa-clock"></i>
        </button>
      </div>
    `;
    
    // 绑定标签点击事件
    picker.addEventListener('click', function(e) {
      const tab = e.target.closest('.emoji-tab');
      if (tab) {
        e.stopPropagation();
        const packId = tab.dataset.packId || tab.dataset.tab;
        selectEmojiTab(tab, packId);
      }
    });
    
    return picker;
  }

  // 加载表情包数据
  async function loadEmojiPacksForPicker() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/emoji/packs`);
      if (response.ok) {
        window.emojiPacks = await response.json();
        MessageState.emojiPacksLoaded = true;
        updatePickerTabs();
        
        // 加载第一个表情包
        if (window.emojiPacks.length > 0) {
          loadEmojiPackContent(window.emojiPacks[0].id);
        }
      }
    } catch (error) {
      console.error('加载表情包失败:', error);
    }
  }

  // 更新表情选择器标签
  function updatePickerTabs() {
    const picker = MessageState.currentEmojiPicker;
    if (!picker) return;
    
    const tabsContainer = picker.querySelector('.emoji-tabs');
    if (!tabsContainer) return;
    
    // 保留最近使用标签
    const recentTab = tabsContainer.querySelector('.recent-tab');
    tabsContainer.innerHTML = '';
    if (recentTab) {
      tabsContainer.appendChild(recentTab);
    }
    
    // 添加表情包标签
    if (window.emojiPacks) {
      window.emojiPacks.forEach(pack => {
        const tab = document.createElement('button');
        tab.className = 'emoji-tab';
        tab.dataset.packId = pack.id;
        tab.title = pack.pack_name;
        
        if (pack.cover_image) {
          tab.innerHTML = `<img src="${API_BASE_URL}${pack.cover_image}" alt="${pack.pack_name}" style="width: 24px; height: 24px; object-fit: contain;">`;
        } else {
          tab.innerHTML = '<i class="far fa-smile"></i>';
        }
        
        tabsContainer.appendChild(tab);
      });
    }
  }

  // 选择表情标签
  function selectEmojiTab(tab, packId) {
    const picker = MessageState.currentEmojiPicker;
    if (!picker) return;
    
    // 移除所有激活状态
    picker.querySelectorAll('.emoji-tab').forEach(t => {
      t.classList.remove('active');
    });
    
    tab.classList.add('active');
    
    if (packId === 'recent') {
      loadRecentEmojis();
    } else {
      loadEmojiPackContent(packId);
    }
  }

  // 加载表情包内容
  async function loadEmojiPackContent(packId) {
    const picker = MessageState.currentEmojiPicker;
    if (!picker) return;
    
    const gridContainer = picker.querySelector('.emoji-grid-container');
    if (!gridContainer) return;
    
    gridContainer.innerHTML = '<div class="emoji-loading"><i class="fas fa-spinner fa-spin"></i></div>';
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/emoji/pack/${packId}/items`);
      if (response.ok) {
        const emojis = await response.json();
        renderEmojiGrid(emojis);
        
        // 激活对应的标签
        picker.querySelectorAll('.emoji-tab').forEach(t => {
          t.classList.remove('active');
          if (t.dataset.packId == packId) {
            t.classList.add('active');
          }
        });
      }
    } catch (error) {
      console.error('加载表情失败:', error);
      gridContainer.innerHTML = '<div class="emoji-empty">加载失败</div>';
    }
  }

  // 渲染表情网格（使用缓存系统）
  async function renderEmojiGrid(emojis) {
    const picker = MessageState.currentEmojiPicker;
    if (!picker) return;
    
    const gridContainer = picker.querySelector('.emoji-grid-container');
    if (!gridContainer) return;
    
    if (emojis.length === 0) {
      gridContainer.innerHTML = `
        <div class="emoji-empty">
          <div class="emoji-empty-icon"><i class="far fa-meh"></i></div>
          <div class="emoji-empty-text">暂无表情</div>
        </div>
      `;
      return;
    }
    
    const grid = document.createElement('div');
    grid.className = 'emoji-grid';
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(6, 1fr)';
    grid.style.gap = '8px';
    grid.style.padding = '12px';
    
    // 如果缓存系统可用，预加载所有表情
    if (window.EmojiCache) {
      const urls = emojis.map(emoji => `${API_BASE_URL}${emoji.file_path}`);
      window.EmojiCache.preloadEmojis(urls); // 异步预加载
    }
    
    emojis.forEach(emoji => {
      const item = document.createElement('div');
      item.className = 'emoji-item';
      item.style.cursor = 'pointer';
      item.style.padding = '4px';
      item.style.borderRadius = '8px';
      item.style.transition = 'all 0.2s';
      
      const img = document.createElement('img');
      img.alt = emoji.emoji_name || emoji.file_name;
      img.style.width = '32px';
      img.style.height = '32px';
      img.style.objectFit = 'contain';
      
      // 使用缓存系统加载图片
      const fullUrl = `${API_BASE_URL}${emoji.file_path}`;
      if (window.EmojiCache && window.EmojiCache.loadImageWithCache) {
        window.EmojiCache.loadImageWithCache(fullUrl, img);
      } else {
        // 降级到直接加载
        img.src = fullUrl;
      }
      
      item.appendChild(img);
      
      const nameSpan = document.createElement('span');
      nameSpan.className = 'emoji-item-name';
      nameSpan.style.display = 'none';
      nameSpan.textContent = emoji.emoji_name || emoji.file_name;
      item.appendChild(nameSpan);
      
      item.addEventListener('mouseenter', () => {
        item.style.background = '#f0f2f5';
        item.style.transform = 'scale(1.1)';
      });
      
      item.addEventListener('mouseleave', () => {
        item.style.background = 'transparent';
        item.style.transform = 'scale(1)';
      });
      
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        sendEmoji(emoji);
      });
      
      grid.appendChild(item);
    });
    
    gridContainer.innerHTML = '';
    gridContainer.appendChild(grid);
  }

  // 发送表情
  function sendEmoji(emoji) {
    if (!window.selectedChatInput) return;
    
    // 创建表情消息 - 包含音频信息
    let emojiMessage;
    if (emoji.audio_path) {
      // 如果有音频，将音频路径也包含在消息中
      emojiMessage = `[emoji:${emoji.id}:${emoji.file_path}:${emoji.audio_path}]`;
      
      // 播放音频
      if (window.EmojiAudioManager) {
        window.EmojiAudioManager.playAudio(`${API_BASE_URL}${emoji.audio_path}`);
      }
    } else {
      emojiMessage = `[emoji:${emoji.id}:${emoji.file_path}]`;
    }
    
    // 插入到输入框
    window.selectedChatInput.value = emojiMessage;
    
    // 触发发送
    const sendBtn = window.selectedChatInput.parentElement.querySelector('.chat-send-btn');
    if (sendBtn) {
      sendBtn.click();
    }
    
    // 关闭选择器
    if (MessageState.currentEmojiPicker) {
      MessageState.currentEmojiPicker.style.display = 'none';
    }
    
    // 移除激活状态
    document.querySelectorAll('.emoji-btn').forEach(btn => {
      btn.classList.remove('active');
    });
  }

  // 加载最近使用的表情
  async function loadRecentEmojis() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const picker = MessageState.currentEmojiPicker;
    if (!picker) return;
    
    const gridContainer = picker.querySelector('.emoji-grid-container');
    if (!gridContainer) return;
    
    gridContainer.innerHTML = '<div class="emoji-loading"><i class="fas fa-spinner fa-spin"></i></div>';
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/emoji/recent`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const emojis = await response.json();
        renderEmojiGrid(emojis);
      }
    } catch (error) {
      console.error('加载最近使用表情失败:', error);
      gridContainer.innerHTML = '<div class="emoji-empty">暂无最近使用</div>';
    }
  }

  // ==================== 改进的聊天记录加载（增量更新）====================
  async function loadChatHistory(userId) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    // 清除旧的检查定时器
    if (MessageState.messageCheckInterval) {
      clearInterval(MessageState.messageCheckInterval);
      MessageState.messageCheckInterval = null;
    }
    
    // 清空已加载消息记录
    MessageState.loadedMessages.clear();
    MessageState.lastMessageId = null;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/conversation/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const messages = await response.json();
        
        // 初次渲染所有消息
        renderInitialMessages(messages);
        
        // 记录已加载的消息
        messages.forEach(msg => {
          MessageState.loadedMessages.set(msg.id, msg);
        });
        
        // 记录最后一条消息ID
        if (messages.length > 0) {
          MessageState.lastMessageId = messages[messages.length - 1].id;
        }
        
        // 启动增量检查
        startIncrementalCheck(userId);
      }
    } catch (error) {
      console.error('加载聊天记录失败:', error);
    }
  }

  // 初次渲染消息
  function renderInitialMessages(messages) {
    const messagesDiv = document.getElementById('chat-messages');
    if (!messagesDiv) return;
    
    let html = '';
    messages.forEach(msg => {
      html += createMessageHTML(msg);
    });
    
    messagesDiv.innerHTML = html;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  // 创建单条消息HTML
  function createMessageHTML(msg) {
    const content = parseMessageContent(msg.content, msg.message_type);
    
    let statusIcon = '';
    if (msg.is_sent) {
      if (msg.is_read) {
        statusIcon = '<i class="fas fa-check-double read-icon" title="已读"></i>';
      } else {
        statusIcon = '<i class="fas fa-check unread-icon" title="已送达"></i>';
      }
    }
    
    return `
      <div class="chat-message ${msg.is_sent ? 'sent' : 'received'}" data-message-id="${msg.id}">
        <div class="message-bubble">
          ${content}
          <div class="message-meta">
            <span class="message-time">${formatTime(msg.created_at)}</span>
            ${statusIcon}
          </div>
        </div>
      </div>
    `;
  }

  // 启动增量检查
  function startIncrementalCheck(userId) {
    // 每1.5秒检查一次新消息
    MessageState.messageCheckInterval = setInterval(() => {
      checkForNewMessages(userId);
    }, 1500);
  }

  // 检查新消息（增量更新）
  async function checkForNewMessages(userId) {
    const token = localStorage.getItem('token');
    if (!token || !MessageState.currentChatUser) return;
    
    try {
      // 只获取最后一条消息之后的新消息
      const url = MessageState.lastMessageId 
        ? `${API_BASE_URL}/api/messages/conversation/${userId}?after_id=${MessageState.lastMessageId}`
        : `${API_BASE_URL}/api/messages/conversation/${userId}`;
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const messages = await response.json();
        
        if (messages.length > 0) {
          // 只处理新消息
          const newMessages = messages.filter(msg => !MessageState.loadedMessages.has(msg.id));
          
          if (newMessages.length > 0) {
            appendNewMessages(newMessages);
          }
          
          // 更新已有消息的状态（如已读状态）
          updateExistingMessagesStatus(messages);
        }
      }
    } catch (error) {
      console.error('检查新消息失败:', error);
    }
  }

  // 添加新消息到聊天窗口
  function appendNewMessages(newMessages) {
    const messagesDiv = document.getElementById('chat-messages');
    if (!messagesDiv) return;
    
    // 记录当前滚动位置
    const wasAtBottom = messagesDiv.scrollHeight - messagesDiv.scrollTop < messagesDiv.clientHeight + 100;
    
    // 添加新消息
    newMessages.forEach(msg => {
      // 跳过临时消息
      const tempMsg = messagesDiv.querySelector(`[data-temp-id]`);
      if (tempMsg) {
        const tempContent = tempMsg.querySelector('.message-bubble').textContent;
        if (msg.is_sent && tempContent.includes(msg.content)) {
          tempMsg.remove();
        }
      }
      
      // 添加消息到DOM
      const messageHTML = createMessageHTML(msg);
      messagesDiv.insertAdjacentHTML('beforeend', messageHTML);
      
      // 记录消息
      MessageState.loadedMessages.set(msg.id, msg);
      MessageState.lastMessageId = msg.id;
      
      // 如果是收到的消息，播放提示音（可选）
      if (!msg.is_sent && window.playMessageSound) {
        window.playMessageSound();
      }
      
      // 动画效果
      const newMsgElement = messagesDiv.querySelector(`[data-message-id="${msg.id}"]`);
      if (newMsgElement) {
        newMsgElement.style.animation = 'messageSlide 0.3s ease';
      }
    });
    
    // 只有在用户原本在底部时才自动滚动
    if (wasAtBottom) {
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    } else {
      // 显示新消息提示
      showNewMessageIndicator();
    }
  }

  // 更新已有消息的状态
  function updateExistingMessagesStatus(messages) {
    messages.forEach(msg => {
      const existingMsg = MessageState.loadedMessages.get(msg.id);
      
      // 只更新状态变化的消息
      if (existingMsg && existingMsg.is_read !== msg.is_read) {
        existingMsg.is_read = msg.is_read;
        
        // 更新DOM中的状态图标
        const msgElement = document.querySelector(`[data-message-id="${msg.id}"]`);
        if (msgElement) {
          const statusIcon = msgElement.querySelector('.message-meta i');
          if (statusIcon) {
            if (msg.is_read) {
              statusIcon.className = 'fas fa-check-double read-icon';
              statusIcon.title = '已读';
            } else {
              statusIcon.className = 'fas fa-check unread-icon';
              statusIcon.title = '已送达';
            }
          }
        }
      }
    });
  }

  // 显示新消息提示
  function showNewMessageIndicator() {
    const messagesDiv = document.getElementById('chat-messages');
    if (!messagesDiv) return;
    
    // 检查是否已有提示
    let indicator = messagesDiv.querySelector('.new-message-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'new-message-indicator';
      indicator.innerHTML = `
        <i class="fas fa-arrow-down"></i>
        <span>新消息</span>
      `;
      indicator.onclick = () => {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        indicator.remove();
      };
      messagesDiv.appendChild(indicator);
    }
  }

  // ==================== 发送消息（优化版本）====================
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
    
    // 生成临时ID
    const tempId = 'temp_' + Date.now();
    const tempMessageData = {
      id: tempId,
      content: processedContent,
      message_type: messageType,
      is_sent: true,
      is_read: false,
      created_at: new Date().toISOString()
    };
    
    // 添加临时消息显示（不重新渲染整个列表）
    const messagesDiv = document.getElementById('chat-messages');
    if (messagesDiv) {
      const messageHTML = `
        <div class="chat-message sent" data-temp-id="${tempId}" style="animation: messageSlide 0.3s ease;">
          <div class="message-bubble">
            ${displayContent}
            <div class="message-meta">
              <span class="message-time">发送中...</span>
              <i class="fas fa-circle-notch fa-spin sending-icon"></i>
            </div>
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
        
        // 更新临时消息为正式消息
        const tempMsg = document.querySelector(`[data-temp-id="${tempId}"]`);
        if (tempMsg) {
          tempMsg.setAttribute('data-message-id', result.id);
          tempMsg.removeAttribute('data-temp-id');
          const meta = tempMsg.querySelector('.message-meta');
          if (meta) {
            meta.innerHTML = `
              <span class="message-time">刚刚</span>
              <i class="fas fa-check unread-icon"></i>
            `;
          }
        }
        
        // 记录消息
        MessageState.loadedMessages.set(result.id, {
          ...result,
          is_sent: true,
          is_read: false
        });
        MessageState.lastMessageId = result.id;
      } else {
        throw new Error('发送失败');
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      const tempMsg = document.querySelector(`[data-temp-id="${tempId}"]`);
      if (tempMsg) {
        const meta = tempMsg.querySelector('.message-meta');
        if (meta) {
          meta.innerHTML = `
            <span class="message-time" style="color: #dc3545;">发送失败</span>
            <i class="fas fa-exclamation-circle" style="color: #dc3545;" onclick="resendMessage('${tempId}')"></i>
          `;
        }
      }
    } finally {
      setTimeout(() => {
        MessageState.isSending = false;
      }, 1000);
    }
  }

  // ==================== 解析消息内容（支持缓存）====================
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
          
          // 创建图片元素
          const imgId = 'emoji_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          
          // 异步加载缓存图片
          if (window.EmojiCache && window.EmojiCache.loadImageWithCache) {
            setTimeout(() => {
              const imgElement = document.getElementById(imgId);
              if (imgElement) {
                window.EmojiCache.loadImageWithCache(emojiPath, imgElement);
              }
            }, 0);
          }
          
          return `<img id="${imgId}" src="${emojiPath}" style="max-width: 120px; max-height: 120px; vertical-align: middle; border-radius: 8px;" alt="表情">`;
        }
      } catch (e) {
        console.error('解析表情消息失败:', e);
      }
    }
    
    // 处理普通文本中的表情标记
    if (typeof content === 'string' && content.includes('[emoji:')) {
      content = content.replace(/\[emoji:(\d+):(.*?)\]/g, function(match, id, path) {
        const fullPath = API_BASE_URL + path;
        const imgId = 'emoji_msg_' + id + '_' + Date.now();
        
        // 异步加载缓存图片
        if (window.EmojiCache && window.EmojiCache.loadImageWithCache) {
          setTimeout(() => {
            const imgElement = document.getElementById(imgId);
            if (imgElement) {
              window.EmojiCache.loadImageWithCache(fullPath, imgElement);
            }
          }, 0);
        }
        
        return `<img id="${imgId}" src="${fullPath}" style="max-width: 120px; max-height: 120px; vertical-align: middle; border-radius: 8px;" alt="表情">`;
      });
      return content;
    }
    
    // 默认返回转义的文本
    return escapeHtml(content);
  }

  // ==================== 系统消息模态框 ====================
  function showSystemMessage(message) {
    // 先关闭消息下拉窗口
    closeMessageDropdown();
    
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
        
        // 关闭消息下拉窗口
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

  // 关闭聊天窗口（清理定时器）
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
    
    // 清理消息检查定时器
    if (MessageState.messageCheckInterval) {
      clearInterval(MessageState.messageCheckInterval);
      MessageState.messageCheckInterval = null;
    }
    
    // 清理已加载消息记录
    MessageState.loadedMessages.clear();
    MessageState.currentChatUser = null;
    MessageState.lastMessageId = null;
  }

  // 选择聊天用户
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
    
    // 显示在线状态
    const statusEl = document.getElementById('chat-user-status');
    if (statusEl) {
      statusEl.style.display = 'flex';
      // 这里可以根据实际在线状态更新显示
      updateUserOnlineStatus(userId);
    }
    
    loadChatHistory(userId);
  }

  // 更新用户在线状态
  async function updateUserOnlineStatus(userId) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const statusEl = document.getElementById('chat-user-status');
        if (statusEl) {
          const indicator = statusEl.querySelector('.status-indicator');
          const text = statusEl.querySelector('.status-text');
          
          if (data.online) {
            indicator.className = 'status-indicator online';
            text.textContent = '在线';
          } else {
            indicator.className = 'status-indicator offline';
            text.textContent = '离线';
          }
        }
      }
    } catch (error) {
      console.error('获取用户状态失败:', error);
    }
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
    // 关闭消息下拉窗口
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
  global.loadEmojiPackContent = loadEmojiPackContent;
  global.startHeartbeat = startHeartbeat;
  
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
      if (MessageState.heartbeatInterval) {
        clearInterval(MessageState.heartbeatInterval);
      }
      if (MessageState.messageCheckInterval) {
        clearInterval(MessageState.messageCheckInterval);
      }
    }
  }, 2000);

  // 点击外部关闭表情选择器
  document.addEventListener('click', function(e) {
    if (MessageState.currentEmojiPicker && MessageState.currentEmojiPicker.style.display === 'flex') {
      const isEmojiBtn = e.target.closest('.emoji-btn');
      const isPicker = e.target.closest('.chat-emoji-picker');
      
      if (!isEmojiBtn && !isPicker) {
        MessageState.currentEmojiPicker.style.display = 'none';
        document.querySelectorAll('.emoji-btn').forEach(btn => {
          btn.classList.remove('active');
        });
      }
    }
  });

  console.log('Complete message system with real-time features loaded');

})(window);