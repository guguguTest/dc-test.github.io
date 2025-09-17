// 临时修复脚本
(function() {
  // 定义 openChatWithFriend 函数
  window.openChatWithFriend = function(friendId) {
    console.log('尝试打开聊天窗口，好友ID:', friendId);
    
    // 确保消息系统已初始化
    if (typeof window.initMessageSystem === 'function' && !window.messageSystemInitialized) {
      window.initMessageSystem();
      window.messageSystemInitialized = true;
    }
    
    // 延迟执行以确保消息系统加载完成
    setTimeout(() => {
      if (typeof window.openChatModal === 'function') {
        window.openChatModal(friendId);
      } else {
        console.error('openChatModal 函数未定义');
        // 直接创建一个简单的聊天窗口作为备用方案
        createSimpleChatWindow(friendId);
      }
    }, 300);
  };
  
  // 备用的简单聊天窗口
  function createSimpleChatWindow(userId) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    // 获取用户信息并创建聊天窗口
    fetch(`https://api.am-all.com.cn/api/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(user => {
      // 创建或获取聊天模态框
      let modal = document.getElementById('chat-modal');
      if (!modal) {
        const modalHTML = `
          <div id="chat-modal" class="chat-modal show">
            <div class="chat-container">
              <div class="chat-header">
                <div class="chat-user-info">
                  <img src="${user.avatar || 'https://api.am-all.com.cn/avatars/default_avatar.png'}" alt="" class="chat-avatar">
                  <div>
                    <div class="chat-username">${user.nickname || user.username}</div>
                  </div>
                </div>
                <button class="chat-close" onclick="document.getElementById('chat-modal').classList.remove('show')">&times;</button>
              </div>
              <div class="chat-messages" id="chat-messages"></div>
              <div class="chat-input-area">
                <input type="text" class="chat-input" id="chat-input" placeholder="输入消息...">
                <button class="chat-send-btn" onclick="alert('消息功能正在加载')">发送</button>
              </div>
            </div>
          </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
      } else {
        modal.classList.add('show');
      }
    })
    .catch(error => {
      console.error('获取用户信息失败:', error);
      alert('打开聊天窗口失败');
    });
  }
  
  // 确保页面刷新后初始化
  document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (token) {
      // 初始化消息系统
      setTimeout(() => {
        if (typeof window.initMessageSystem === 'function') {
          window.initMessageSystem();
          window.messageSystemInitialized = true;
        }
      }, 500);
      
      // 初始化好友系统
      setTimeout(() => {
        if (typeof window.initFriendsSystem === 'function' && !window.friendsSystemInitialized) {
          window.friendsSystemInitialized = true;
          window.initFriendsSystem();
        }
      }, 800);
    }
  });
})();