// 表情聊天功能修复补丁
(function(global) {
  'use strict';

  // 确保API_BASE_URL存在
  if (typeof window.API_BASE_URL === 'undefined') {
    window.API_BASE_URL = 'https://api.am-all.com.cn';
  }
  const API_BASE_URL = window.API_BASE_URL;

  // 存储当前表情选择器引用
  let currentEmojiPicker = null;
  let currentChatContainer = null;
  let emojiPacksLoaded = false;

  // 修复1: 创建跟随聊天窗口的表情选择器
  function createFollowingEmojiPicker(chatContainer) {
    // 移除旧的表情选择器
    if (currentEmojiPicker) {
      currentEmojiPicker.remove();
      currentEmojiPicker = null;
    }

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
    
    // 将表情选择器作为聊天容器的子元素
    chatContainer.appendChild(picker);
    currentEmojiPicker = picker;
    currentChatContainer = chatContainer;
    
    // 设置相对定位
    picker.style.position = 'absolute';
    picker.style.bottom = '60px';
    picker.style.left = '10px';
    picker.style.width = '340px';
    picker.style.height = '400px';
    picker.style.zIndex = '1400';
    
    return picker;
  }

  // 修复表情按钮点击事件
  global.toggleChatEmojiPicker = function(btn) {
    // 设置当前输入框
    window.selectedChatInput = document.getElementById('chat-input');
    
    // 查找聊天容器
    const chatContainer = btn.closest('.chat-container');
    if (!chatContainer) {
      console.error('找不到聊天容器');
      return;
    }
    
    // 获取或创建表情选择器
    let picker = chatContainer.querySelector('.chat-emoji-picker');
    
    if (picker && picker.classList.contains('show')) {
      picker.classList.remove('show');
      btn.classList.remove('active');
      return;
    }
    
    if (!picker) {
      picker = createFollowingEmojiPicker(chatContainer);
    }
    
    // 显示选择器
    picker.classList.add('show');
    btn.classList.add('active');
    
    // 加载表情包
    if (!emojiPacksLoaded) {
      loadEmojiPacksForChat();
    } else if (window.emojiPacks && window.emojiPacks.length > 0) {
      // 如果已加载，显示第一个表情包
      loadEmojiPackContent(window.emojiPacks[0].id);
    }
  };

  // 修复2: 加载表情包并更新标签
  async function loadEmojiPacksForChat() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/emoji/packs`);
      if (response.ok) {
        window.emojiPacks = await response.json();
        emojiPacksLoaded = true;
        updateChatEmojiTabs();
        
        // 加载第一个表情包
        if (window.emojiPacks.length > 0) {
          loadEmojiPackContent(window.emojiPacks[0].id);
        }
      }
    } catch (error) {
      console.error('加载表情包失败:', error);
    }
  }

  // 修复3: 更新聊天窗口中的表情标签
  function updateChatEmojiTabs() {
    const picker = currentEmojiPicker;
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
    window.emojiPacks.forEach(pack => {
      const tab = document.createElement('button');
      tab.className = 'emoji-tab';
      tab.dataset.packId = pack.id;
      tab.title = pack.pack_name;
      
      if (pack.cover_image) {
        tab.innerHTML = `<img src="${API_BASE_URL}${pack.cover_image}" alt="${pack.pack_name}">`;
      } else {
        tab.innerHTML = '<i class="far fa-smile"></i>';
      }
      
      tab.addEventListener('click', () => {
        selectEmojiTab(tab, pack.id);
      });
      
      tabsContainer.appendChild(tab);
    });
  }

  // 选择表情标签
  function selectEmojiTab(tab, packId) {
    const picker = currentEmojiPicker;
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

  // 修复加载表情包内容
  async function loadEmojiPackContent(packId) {
    const picker = currentEmojiPicker;
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

  // 渲染表情网格
  function renderEmojiGrid(emojis) {
    const picker = currentEmojiPicker;
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
    
    emojis.forEach(emoji => {
      const item = document.createElement('div');
      item.className = 'emoji-item';
      item.innerHTML = `
        <img src="${API_BASE_URL}${emoji.file_path}" alt="${emoji.emoji_name || emoji.file_name}">
        <span class="emoji-item-name">${emoji.emoji_name || emoji.file_name}</span>
      `;
      
      item.addEventListener('click', () => {
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
    
    // 创建表情消息
    const emojiMessage = `[emoji:${emoji.id}:${emoji.file_path}]`;
    
    // 插入到输入框
    window.selectedChatInput.value = emojiMessage;
    
    // 触发发送
    const sendBtn = window.selectedChatInput.parentElement.querySelector('.chat-send-btn');
    if (sendBtn) {
      sendBtn.click();
    }
    
    // 关闭选择器
    if (currentEmojiPicker) {
      currentEmojiPicker.classList.remove('show');
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
    
    const picker = currentEmojiPicker;
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

  // 修复4: 重写渲染聊天消息函数以正确显示表情
  const originalRenderChatMessages = window.renderChatMessages;
  
  window.renderChatMessages = function(messages) {
    const messagesDiv = document.getElementById('chat-messages');
    if (!messagesDiv) return;
    
    let html = '';
    
    messages.forEach(msg => {
      const isSent = msg.is_sent;
      let messageContent = '';
      
      // 检查消息类型和内容格式 - 修复表情显示
      if (msg.message_type === 'emoji' || (typeof msg.content === 'string' && msg.content.includes('emoji_path'))) {
        try {
          let emojiData;
          
          // 尝试解析JSON格式的表情数据
          if (typeof msg.content === 'string') {
            // 检查是否是JSON字符串
            if (msg.content.startsWith('{') && msg.content.includes('emoji_path')) {
              try {
                emojiData = JSON.parse(msg.content);
              } catch (e) {
                // 如果解析失败，尝试提取路径
                const match = msg.content.match(/"emoji_path":"([^"]+)"/);
                if (match && match[1]) {
                  emojiData = { emoji_path: match[1] };
                }
              }
            } else {
              // 可能是旧格式的表情消息
              messageContent = escapeHtml(msg.content);
            }
          } else if (typeof msg.content === 'object') {
            emojiData = msg.content;
          }
          
          // 渲染表情图片
          if (emojiData && emojiData.emoji_path) {
            // 确保路径格式正确
            const emojiPath = emojiData.emoji_path.startsWith('http') 
              ? emojiData.emoji_path 
              : `${API_BASE_URL}${emojiData.emoji_path}`;
            messageContent = `<img src="${emojiPath}" style="max-width: 120px; max-height: 120px;" alt="表情">`;
          } else {
            messageContent = escapeHtml(msg.content);
          }
        } catch (e) {
          console.error('解析表情消息失败:', e);
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
  };

  // 工具函数
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

  // 点击外部关闭表情选择器
  document.addEventListener('click', function(e) {
    if (currentEmojiPicker && currentEmojiPicker.classList.contains('show')) {
      const isEmojiBtn = e.target.closest('.emoji-btn');
      const isPicker = e.target.closest('.chat-emoji-picker');
      
      if (!isEmojiBtn && !isPicker) {
        currentEmojiPicker.classList.remove('show');
        document.querySelectorAll('.emoji-btn').forEach(btn => {
          btn.classList.remove('active');
        });
      }
    }
  });

  // 清理函数
  window.cleanupChatEmojiPicker = function() {
    if (currentEmojiPicker) {
      currentEmojiPicker.remove();
      currentEmojiPicker = null;
    }
    currentChatContainer = null;
    emojiPacksLoaded = false;
  };

  // 在关闭聊天窗口时清理
  const originalCloseChatModal = window.closeChatModal;
  window.closeChatModal = function() {
    cleanupChatEmojiPicker();
    if (originalCloseChatModal) {
      originalCloseChatModal.call(this);
    }
  };

  // 暴露必要的函数
  global.loadEmojiPackContent = loadEmojiPackContent;
  global.updateChatEmojiTabs = updateChatEmojiTabs;

  console.log('Emoji chat fix loaded successfully');

})(window);
