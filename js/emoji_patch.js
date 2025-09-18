// 表情系统补丁 - 修复聊天窗口中的表情功能
(function(global) {
  'use strict';

  // 等待表情系统初始化
  function ensureEmojiSystem() {
    // 确保必要的全局变量存在
    if (typeof window.emojiPacks === 'undefined') {
      window.emojiPacks = [];
    }
    
    // 暴露必要的表情函数到全局
    if (typeof window.toggleEmojiPicker === 'undefined') {
      window.toggleEmojiPicker = function(btn) {
        let picker = document.querySelector('.emoji-picker');
        
        if (picker && picker.classList.contains('show')) {
          picker.classList.remove('show');
          btn.classList.remove('active');
          return;
        }
        
        if (!picker) {
          picker = createEmojiPicker();
          document.body.appendChild(picker);
        }
        
        // 定位到按钮附近
        const btnRect = btn.getBoundingClientRect();
        const pickerHeight = 400;
        const pickerWidth = 340;
        
        // 计算位置
        let top = btnRect.top - pickerHeight - 10;
        let left = btnRect.left - pickerWidth + btnRect.width;
        
        // 检查是否超出视口
        if (top < 10) {
          top = btnRect.bottom + 10;
        }
        if (left < 10) {
          left = 10;
        }
        if (left + pickerWidth > window.innerWidth - 10) {
          left = window.innerWidth - pickerWidth - 10;
        }
        
        picker.style.position = 'fixed';
        picker.style.top = top + 'px';
        picker.style.left = left + 'px';
        picker.style.zIndex = '1300';
        
        picker.classList.add('show');
        btn.classList.add('active');
        
        // 加载第一个表情包
        if (window.emojiPacks.length > 0) {
          loadEmojiPackContent(window.emojiPacks[0].id);
        } else {
          // 如果没有表情包，尝试加载
          loadEmojiPacks();
        }
      };
    }
    
    // 创建表情选择器
    function createEmojiPicker() {
      const picker = document.createElement('div');
      picker.className = 'emoji-picker';
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
          const packId = tab.dataset.packId || tab.dataset.tab;
          if (packId === 'recent') {
            loadRecentEmojis();
          } else if (packId) {
            loadEmojiPackContent(packId);
          }
        }
      });
      
      return picker;
    }
    
    // 加载表情包
    async function loadEmojiPacks() {
      try {
        const response = await fetch(`${window.API_BASE_URL}/api/emoji/packs`);
        if (response.ok) {
          window.emojiPacks = await response.json();
          updateEmojiTabs();
          
          // 加载第一个表情包
          if (window.emojiPacks.length > 0) {
            loadEmojiPackContent(window.emojiPacks[0].id);
          }
        }
      } catch (error) {
        console.error('加载表情包失败:', error);
      }
    }
    
    // 更新表情标签
    function updateEmojiTabs() {
      const tabsContainer = document.querySelector('.emoji-tabs');
      if (!tabsContainer) return;
      
      // 清空现有标签（保留最近使用）
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
          tab.innerHTML = `<img src="${window.API_BASE_URL}${pack.cover_image}" alt="${pack.pack_name}">`;
        } else {
          tab.innerHTML = '<i class="far fa-smile"></i>';
        }
        
        tabsContainer.appendChild(tab);
      });
    }
    
    // 加载表情包内容
    async function loadEmojiPackContent(packId) {
      const gridContainer = document.querySelector('.emoji-grid-container');
      if (!gridContainer) return;
      
      gridContainer.innerHTML = '<div class="emoji-loading"><i class="fas fa-spinner fa-spin"></i></div>';
      
      try {
        const response = await fetch(`${window.API_BASE_URL}/api/emoji/pack/${packId}/items`);
        if (response.ok) {
          const emojis = await response.json();
          renderEmojiGrid(emojis);
          
          // 激活对应的标签
          document.querySelectorAll('.emoji-tab').forEach(t => {
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
      const gridContainer = document.querySelector('.emoji-grid-container');
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
          <img src="${window.API_BASE_URL}${emoji.file_path}" alt="${emoji.emoji_name || emoji.file_name}">
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
      const picker = document.querySelector('.emoji-picker');
      if (picker) {
        picker.classList.remove('show');
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
      
      const gridContainer = document.querySelector('.emoji-grid-container');
      if (!gridContainer) return;
      
      gridContainer.innerHTML = '<div class="emoji-loading"><i class="fas fa-spinner fa-spin"></i></div>';
      
      try {
        const response = await fetch(`${window.API_BASE_URL}/api/emoji/recent`, {
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
    
    // 暴露函数到全局
    window.loadEmojiPackContent = loadEmojiPackContent;
    window.loadEmojiPacks = loadEmojiPacks;
  }
  
  // 点击外部关闭表情选择器
  document.addEventListener('click', function(e) {
    const picker = document.querySelector('.emoji-picker');
    if (!picker) return;
    
    const isEmojiBtn = e.target.closest('.emoji-btn');
    const isPicker = e.target.closest('.emoji-picker');
    
    if (!isEmojiBtn && !isPicker && picker.classList.contains('show')) {
      picker.classList.remove('show');
      document.querySelectorAll('.emoji-btn').forEach(btn => {
        btn.classList.remove('active');
      });
    }
  });
  
  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureEmojiSystem);
  } else {
    setTimeout(ensureEmojiSystem, 100);
  }
  
  // 暴露初始化函数
  global.ensureEmojiSystem = ensureEmojiSystem;

})(window);
