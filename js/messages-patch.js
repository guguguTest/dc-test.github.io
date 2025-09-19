// messages.js 补丁文件 - 修复消息中心跳转问题
// 此文件应在 messages.js 之后加载

(function(global) {
  'use strict';

  // 保存原始的 handleDropdownClick 函数引用（如果存在）
  const originalHandleDropdownClick = global.handleDropdownClick;

  // 覆盖 handleDropdownClick 函数
  global.handleDropdownClick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // 查看全部消息
    if (e.target.closest('[data-action="view-all"]')) {
      // 调用消息中心模块
      if (typeof window.openMessageCenter === 'function') {
        window.openMessageCenter();
      } else if (typeof window.MessageCenter !== 'undefined' && window.MessageCenter.openMessageCenter) {
        window.MessageCenter.openMessageCenter();
      } else {
        console.error('Message Center module not loaded. Please include message-center.js');
        // 备用方案：直接跳转
        window.location.hash = '#/message-center';
      }
      return;
    }
    
    // 全部已读
    if (e.target.closest('[data-action="mark-all-read"]')) {
      if (typeof window.markAllAsRead === 'function') {
        window.markAllAsRead();
      }
      return;
    }
    
    // 点击消息项
    const messageItem = e.target.closest('.message-item');
    if (messageItem) {
      const messageId = messageItem.getAttribute('data-message-id');
      if (messageId && typeof window.openMessage === 'function') {
        window.openMessage(messageId);
      }
    }
  };

  // 确保消息下拉菜单事件绑定正确
  document.addEventListener('DOMContentLoaded', function() {
    // 重新绑定事件到下拉菜单
    setTimeout(() => {
      const dropdowns = document.querySelectorAll('.message-dropdown, .message-dropdown-mobile');
      dropdowns.forEach(dropdown => {
        // 移除旧的事件监听器
        dropdown.removeEventListener('click', originalHandleDropdownClick);
        // 添加新的事件监听器
        dropdown.addEventListener('click', global.handleDropdownClick);
      });
    }, 1000);
  });

  // 添加全局的 openComposeModal 函数（如果不存在）
  if (typeof global.openComposeModal === 'undefined') {
    global.openComposeModal = function() {
      // 先清理之前的状态
      if (typeof global.currentChatUser !== 'undefined') {
        global.currentChatUser = null;
      }
      
      const modal = global.createChatModal ? global.createChatModal() : createSimpleChatModal();
      modal.classList.add('show');
      
      // 重置标题和头像
      const chatUsername = document.getElementById('chat-username');
      if (chatUsername) {
        chatUsername.textContent = '发送消息';
      }
      
      const avatarEl = document.getElementById('chat-avatar');
      if (avatarEl) {
        avatarEl.style.display = 'none';
      }
      
      // 显示用户搜索
      const searchArea = modal.querySelector('.user-search-area');
      if (searchArea) {
        searchArea.style.display = 'block';
      }
      
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
      
      if (messagesArea) {
        messagesArea.style.display = 'none';
        messagesArea.innerHTML = '';
      }
      
      if (inputArea) {
        inputArea.style.display = 'none';
      }
      
      // 清空输入框
      const chatInput = document.getElementById('chat-input');
      if (chatInput) {
        chatInput.value = '';
      }
    };
  }

  // 创建简单的聊天模态框（备用）
  function createSimpleChatModal() {
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

  console.log('Messages patch loaded successfully');

})(window);
