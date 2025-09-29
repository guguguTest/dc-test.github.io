// 好友功能JavaScript - 增加好友消息提示和优化界面（修复移动端切换问题）
(function(global) {
  'use strict';

  // 确保API_BASE_URL存在
  if (typeof window.API_BASE_URL === 'undefined') {
    window.API_BASE_URL = 'https://api.am-all.com.cn';
  }
  const API_BASE_URL = window.API_BASE_URL;

  let friendsList = [];
  let blacklist = [];
  let friendRequests = [];
  let currentSearchResults = [];
  let friendsCheckInterval = null;
  let friendsStatusInterval = null;
  let friendMessageCheckInterval = null;  // 新增：好友消息检查定时器
  let isInitialized = false;
  let isLoadingData = false;
  let lastDataLoadTime = 0;
  let currentView = 'friends'; // 新增：当前视图（friends, blacklist）
  let friendMessagesCount = 0; // 新增：好友未读消息数
  let heartbeatInterval = null; // 新增：心跳相关变量
  let chatStatusCheckInterval = null; // 新增：聊天在线状态检查

  // 缓存数据的有效期（毫秒）
  const DATA_CACHE_DURATION = 60000; // 1分钟

  // 初始化好友系统
  function initFriendsSystem() {
    // 防止重复初始化
    if (isInitialized) return;
    
    // 先检查登录状态
    const token = localStorage.getItem('token');
    if (!token) return;
    
    isInitialized = true;
    
    // 添加好友图标到导航栏
    addFriendsIconToNavbar();
    
    // 预加载好友数据（后台加载，不阻塞UI）
    preloadFriendsData();
    
    // 检查好友消息
    checkFriendMessages();
    
    // 启动心跳机制
    startHeartbeat();
    
    // 设置定时检查 - 缩短到10秒
    if (friendsCheckInterval) {
      clearInterval(friendsCheckInterval);
    }
    friendsCheckInterval = setInterval(checkFriendRequests, 10000);
    
    // 定期更新好友在线状态（每30秒）
    if (friendsStatusInterval) {
      clearInterval(friendsStatusInterval);
    }
    friendsStatusInterval = setInterval(updateFriendsOnlineStatus, 30000);
    
    // 新增：定期检查好友消息（每5秒）
    if (friendMessageCheckInterval) {
      clearInterval(friendMessageCheckInterval);
    }
    friendMessageCheckInterval = setInterval(checkFriendMessages, 5000);
    
    // 绑定事件
    bindFriendsEvents();
    
    // 请求通知权限
    requestNotificationPermission();
    
    // 监听好友消息更新事件
    window.addEventListener('friendMessagesUpdate', handleFriendMessagesUpdate);
  }

  // 心跳机制函数
  function startHeartbeat() {
    // 清除旧的心跳
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }
    
    // 立即发送一次心跳
    sendHeartbeat();
    
    // 每30秒发送一次心跳
    heartbeatInterval = setInterval(sendHeartbeat, 30000);
    
    console.log('心跳机制已启动');
  }

  async function sendHeartbeat() {
    const token = localStorage.getItem('token');
    if (!token) {
      stopHeartbeat();
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/heartbeat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok && response.status === 401) {
        // Token失效，停止心跳
        stopHeartbeat();
        // 清除本地存储
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // 触发登出事件
        window.dispatchEvent(new Event('userLoggedOut'));
      } else if (response.ok) {
        // 心跳成功，可以在这里更新一些状态
        const data = await response.json();
        // 可选：更新在线好友数等信息
      }
    } catch (error) {
      console.error('心跳发送失败:', error);
    }
  }

  function stopHeartbeat() {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
      console.log('心跳机制已停止');
    }
  }

  // 登出函数
  async function logout() {
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('登出API调用失败:', error);
      }
    }
    
    // 停止心跳
    stopHeartbeat();
    
    // 清理好友系统
    cleanupFriendsSystem();
    
    // 清除本地存储
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // 触发登出事件
    window.dispatchEvent(new Event('userLoggedOut'));
    
    // 重定向到登录页
    window.location.href = '/login.html';
  }

  // 页面卸载时调用登出API
  window.addEventListener('beforeunload', () => {
    const token = localStorage.getItem('token');
    if (token) {
      // 使用sendBeacon确保请求发送
      const data = new FormData();
      data.append('token', token);
      navigator.sendBeacon(`${API_BASE_URL}/api/logout`, data);
    }
  });

  // 监听visibility变化，优化心跳
  document.addEventListener('visibilitychange', () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    if (document.hidden) {
      // 页面隐藏时，减少心跳频率
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = setInterval(sendHeartbeat, 60000); // 1分钟
      }
    } else {
      // 页面可见时，恢复正常心跳
      startHeartbeat();
    }
  });

  // 新增：处理好友消息更新事件
  function handleFriendMessagesUpdate(event) {
    const count = event.detail.unreadCount;
    updateFriendsMessageBadge(count);
  }

  // 新增：检查好友消息
  async function checkFriendMessages() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      // 先确保好友列表已加载
      if (friendsList.length === 0) {
        await loadFriendsData();
      }
      
      const response = await fetch(`${API_BASE_URL}/api/messages?unread=true`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const messages = await response.json();
        
        // 统计好友未读消息
        let friendUnreadCount = 0;
        const friendIds = friendsList.map(f => f.id);
        
        messages.forEach(msg => {
          if (!msg.is_read && msg.message_type === 'user' && friendIds.includes(msg.sender_id)) {
            friendUnreadCount++;
          }
        });
        
        // 如果有新的好友消息，显示通知
        if (friendUnreadCount > friendMessagesCount && friendMessagesCount > 0) {
          showNotification('好友新消息', `您有 ${friendUnreadCount - friendMessagesCount} 条新的好友消息`);
        }
        
        friendMessagesCount = friendUnreadCount;
        updateFriendsMessageBadge(friendUnreadCount);
      }
    } catch (error) {
      console.error('检查好友消息失败:', error);
    }
  }

  // 新增：更新好友消息徽章
  function updateFriendsMessageBadge(count) {
    friendMessagesCount = count;
    
    // 更新好友图标徽章
    const badge = document.getElementById('friends-badge');
    const mobileBadge = document.getElementById('friends-badge-mobile');
    
    // 合并好友请求数和消息数
    const pendingCount = friendRequests.filter(r => r.status === 'pending').length;
    const totalCount = pendingCount + count;
    
    [badge, mobileBadge].forEach(b => {
      if (b) {
        if (totalCount > 0) {
          // 显示详细信息
          if (pendingCount > 0 && count > 0) {
            b.textContent = totalCount > 99 ? '99+' : totalCount;
            b.title = `${pendingCount}个好友请求, ${count}条未读消息`;
          } else if (pendingCount > 0) {
            b.textContent = pendingCount > 99 ? '99+' : pendingCount;
            b.title = `${pendingCount}个好友请求`;
          } else {
            b.textContent = count > 99 ? '99+' : count;
            b.title = `${count}条未读消息`;
          }
          b.style.display = 'block';
        } else {
          b.style.display = 'none';
        }
      }
    });
    
    // 更新图标颜色
    const icon = document.querySelector('.friends-icon');
    const mobileIcon = document.querySelector('.friends-icon-wrapper-mobile .friends-icon');
    
    [icon, mobileIcon].forEach(i => {
      if (i) {
        if (totalCount > 0) {
          i.classList.add('has-notifications');
          if (count > 0) {
            i.style.color = '#667eea'; // 有消息时显示紫色
          } else {
            i.style.color = '#dc3545'; // 只有请求时显示红色
          }
        } else {
          i.classList.remove('has-notifications');
          i.style.color = '#6c757d'; // 无通知时显示灰色
        }
      }
    });
  }

  // 更新好友在线状态
  async function updateFriendsOnlineStatus() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/friends`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const updatedFriends = await response.json();
        
        // 更新好友列表，保持原有数据结构
        friendsList = processFriendsList(updatedFriends);
        
        // 如果下拉菜单打开，更新显示
        const dropdown = document.querySelector('.friends-dropdown.show, .friends-dropdown-mobile.show');
        if (dropdown) {
          // 只更新在线状态，不重新渲染整个菜单
          updateFriendsListDisplay();
        }
      }
    } catch (error) {
      console.error('更新好友在线状态失败:', error);
    }
  }

  // 更新好友列表显示（不重新渲染整个下拉菜单）
  function updateFriendsListDisplay() {
    const friendItems = document.querySelectorAll('.friend-item');
    friendItems.forEach(item => {
      const friendId = parseInt(item.dataset.friendId);
      const friend = friendsList.find(f => f.id === friendId);
      if (friend) {
        // 更新在线状态显示
        const statusElement = item.querySelector('.friend-status span:first-child');
        if (statusElement) {
          statusElement.textContent = friend.online ? '在线' : '离线';
        }
        // 更新data属性
        item.dataset.online = friend.online;
      }
    });
  }

  // 开始聊天在线状态检查
  function startChatOnlineStatusCheck(userId) {
    // 清除旧的检查
    if (chatStatusCheckInterval) {
      clearInterval(chatStatusCheckInterval);
    }
    
    // 每30秒检查一次在线状态
    chatStatusCheckInterval = setInterval(async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        clearInterval(chatStatusCheckInterval);
        return;
      }
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/${userId}/online-status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // 更新聊天窗口的在线状态显示
          updateChatOnlineStatus(data.online);
        }
      } catch (error) {
        console.error('获取在线状态失败:', error);
      }
    }, 30000);
  }

  function updateChatOnlineStatus(isOnline) {
    // 更新聊天窗口中的在线状态
    const statusElement = document.querySelector('.chat-user-status, .chat-modal-status');
    if (statusElement) {
      statusElement.textContent = isOnline ? '在线' : '离线';
      statusElement.className = statusElement.className.replace(/online|offline/, '') + 
                             ` ${isOnline ? 'online' : 'offline'}`;
    }
  }

  // 预加载好友数据（后台加载）
  async function preloadFriendsData() {
    const now = Date.now();
    if (now - lastDataLoadTime < DATA_CACHE_DURATION) {
      // 数据还在缓存有效期内，不需要重新加载
      return;
    }
    
    if (!isLoadingData) {
      isLoadingData = true;
      try {
        await loadFriendsData();
        lastDataLoadTime = now;
      } finally {
        isLoadingData = false;
      }
    }
  }

  // 添加好友图标到导航栏
  function addFriendsIconToNavbar() {
    // 检查是否已存在
    if (document.getElementById('friends-icon-wrapper')) return;
    
    // PC端好友图标 - 插入到消息图标之前
    const pcMessageWrapper = document.getElementById('message-icon-wrapper');
    if (pcMessageWrapper) {
      const pcFriendsIconHTML = `
        <div class="friends-icon-wrapper" id="friends-icon-wrapper">
          <i class="fas fa-user-friends friends-icon"></i>
          <span class="friends-badge" id="friends-badge" style="display: none;">0</span>
          <div class="friends-dropdown" id="friends-dropdown"></div>
        </div>
      `;
      pcMessageWrapper.insertAdjacentHTML('beforebegin', pcFriendsIconHTML);
    }
    
    // 移动端好友图标 - 插入到消息图标之前
    const mobileMessageWrapper = document.getElementById('message-icon-wrapper-mobile');
    if (mobileMessageWrapper) {
      const mobileFriendsIconHTML = `
        <div class="friends-icon-wrapper-mobile" id="friends-icon-wrapper-mobile">
          <i class="fas fa-user-friends friends-icon"></i>
          <span class="friends-badge" id="friends-badge-mobile" style="display: none;">0</span>
          <div class="friends-dropdown-mobile" id="friends-dropdown-mobile"></div>
        </div>
      `;
      mobileMessageWrapper.insertAdjacentHTML('beforebegin', mobileFriendsIconHTML);
    }
  }

  // 加载好友数据 - 优化版
  async function loadFriendsData(forceUpdate = false) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    // 如果不是强制更新且数据还在缓存期内，直接返回
    if (!forceUpdate && Date.now() - lastDataLoadTime < DATA_CACHE_DURATION) {
      return;
    }
    
    try {
      // 并行加载所有数据
      const [friendsRes, blacklistRes, requestsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/friends`, {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }),
        fetch(`${API_BASE_URL}/api/friends/blacklist`, {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }),
        fetch(`${API_BASE_URL}/api/friends/requests`, {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        })
      ]);
      
      // 处理响应
      if (friendsRes.ok) {
        const rawFriendsList = await friendsRes.json();
        friendsList = processFriendsList(rawFriendsList);
      } else {
        console.warn('加载好友列表失败:', friendsRes.status);
        friendsList = [];
      }
      
      if (blacklistRes.ok) {
        blacklist = await blacklistRes.json();
      } else {
        console.warn('加载黑名单失败:', blacklistRes.status);
        blacklist = [];
      }
      
      if (requestsRes.ok) {
        friendRequests = await requestsRes.json();
      } else {
        console.warn('加载好友请求失败:', requestsRes.status);
        friendRequests = [];
      }
      
      updateFriendsBadge();
      lastDataLoadTime = Date.now();
      
    } catch (error) {
      console.error('加载好友数据失败:', error);
      friendsList = [];
      blacklist = [];
      friendRequests = [];
      updateFriendsBadge();
    }
  }

  // 处理好友列表数据
  function processFriendsList(rawFriendsList) {
    const rankBackgrounds = {
      0: 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_normal.png',
      1: 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_bronze.png',
      2: 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_silver.png',
      3: 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_gold.png',
      4: 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_platinum.png',
      5: 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_rainbow.png'
    };
    
    return rawFriendsList.map(friend => {
      const hasRainbowEffect = friend.rank_sp === 1 || friend.rankSp === 1 || friend.user_rank === 5;
      
      return {
        ...friend,
        userRank: friend.user_rank || 0,
        rankBackground: rankBackgrounds[friend.user_rank || 0],
        rankSp: hasRainbowEffect ? 1 : 0,
        banState: friend.ban_state || 0,
        avatar: friend.avatar || 'https://api.am-all.com.cn/avatars/default_avatar.png',
        online: friend.online === true
      };
    });
  }

  // 检查好友请求 - 优化版
  async function checkFriendRequests() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/friends/requests`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const newRequests = await response.json();
        
        // 检查是否有新的请求
        const oldPendingCount = friendRequests.filter(r => r.status === 'pending').length;
        const newPendingCount = newRequests.filter(r => r.status === 'pending').length;
        
        if (newPendingCount > oldPendingCount) {
          // 有新的好友请求，显示通知
          showNotification('新的好友请求', '您有新的好友请求待处理');
        }
        
        friendRequests = newRequests;
        updateFriendsBadge();
      }
    } catch (error) {
      console.error('检查好友请求失败:', error);
    }
  }

  // 更新好友请求徽章
  function updateFriendsBadge() {
    const pendingCount = friendRequests.filter(r => r.status === 'pending').length;
    const totalCount = pendingCount + friendMessagesCount;
    
    const badge = document.getElementById('friends-badge');
    const mobileBadge = document.getElementById('friends-badge-mobile');
    
    [badge, mobileBadge].forEach(b => {
      if (b) {
        if (totalCount > 0) {
          b.textContent = totalCount > 99 ? '99+' : totalCount;
          b.style.display = 'block';
        } else {
          b.style.display = 'none';
        }
      }
    });
    
    // 更新图标颜色
    const icon = document.querySelector('.friends-icon');
    const mobileIcon = document.querySelector('.friends-icon-wrapper-mobile .friends-icon');
    
    [icon, mobileIcon].forEach(i => {
      if (i) {
        if (totalCount > 0) {
          i.classList.add('has-requests');
        } else {
          i.classList.remove('has-requests');
        }
      }
    });
  }

  // 绑定事件
  function bindFriendsEvents() {
    document.addEventListener('click', function(e) {
      // 点击好友图标
      const wrapper = e.target.closest('.friends-icon-wrapper');
      if (wrapper) {
        e.stopPropagation();
        e.preventDefault();
        toggleFriendsDropdown('desktop');
        return;
      }
      
      // 移动端好友图标
      const mobileWrapper = e.target.closest('.friends-icon-wrapper-mobile');
      if (mobileWrapper) {
        e.stopPropagation();
        e.preventDefault();
        toggleFriendsDropdown('mobile');
        return;
      }
      
      // 处理下拉菜单内的按钮点击
      const dropdown = e.target.closest('.friends-dropdown, .friends-dropdown-mobile');
      if (dropdown) {
        // 检查是否点击了特定的按钮或功能区域
        const clickableElements = [
          '.friends-toolbar-btn',
          '.request-btn',
          '.friend-item',
          '.blacklist-item',
          '.search-result-item',
          '.search-action-btn',
          '.unblock-btn',
          '.friends-search-input',
          '.friends-group-header',
          '.friend-message-item'  // 新增：好友消息项
        ];
        
        for (let selector of clickableElements) {
          if (e.target.closest(selector)) {
            e.stopPropagation(); // 阻止事件冒泡，防止关闭菜单
            return;
          }
        }
        
        // 如果点击的是下拉菜单的背景区域，不做处理
        return;
      }
      
      // 点击其他地方关闭下拉菜单
      closeFriendsDropdown();
    });
  }

  // 切换好友下拉菜单
  function toggleFriendsDropdown(type = 'desktop') {
    const dropdownId = type === 'mobile' ? 'friends-dropdown-mobile' : 'friends-dropdown';
    const dropdown = document.getElementById(dropdownId);
    
    if (!dropdown) return;
    
    if (dropdown.classList.contains('show')) {
      closeFriendsDropdown();
    } else {
      openFriendsDropdown(type);
    }
  }

  // 打开好友下拉菜单 - 优化版
  async function openFriendsDropdown(type = 'desktop') {
    const dropdownId = type === 'mobile' ? 'friends-dropdown-mobile' : 'friends-dropdown';
    const dropdown = document.getElementById(dropdownId);
    
    if (!dropdown) return;
    
    // 立即显示下拉菜单和加载中状态
    dropdown.classList.add('show');
    renderLoadingState(dropdown);
    
    // 强制刷新好友数据
    await loadFriendsData(true);
    
    // 检查好友消息
    await checkFriendMessages();
    
    // 渲染实际内容
    renderFriendsDropdown(type);
  }

  // 渲染加载中状态
  function renderLoadingState(dropdown) {
    dropdown.innerHTML = `
      <div class="friends-dropdown-header">
        <div class="friends-dropdown-title">
          <i class="fas fa-user-friends"></i>
          <span>好友</span>
        </div>
      </div>
      <div class="friends-loading" style="padding: 60px 20px; text-align: center;">
        <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #667eea;"></i>
        <p style="margin-top: 10px; color: #6c757d;">加载中...</p>
      </div>
    `;
  }

  // 关闭好友下拉菜单
  function closeFriendsDropdown() {
    const dropdowns = document.querySelectorAll('.friends-dropdown, .friends-dropdown-mobile');
    dropdowns.forEach(dropdown => {
      dropdown.classList.remove('show');
      // 关闭搜索框
      const searchBox = dropdown.querySelector('.friends-search-box');
      if (searchBox) {
        searchBox.classList.remove('show');
      }
    });
    
    // 重置当前视图
    currentView = 'friends';
  }

  // 修复：渲染好友下拉菜单 - 增加三按钮界面
  function renderFriendsDropdown(type = 'desktop') {
    const dropdownId = type === 'mobile' ? 'friends-dropdown-mobile' : 'friends-dropdown';
    const dropdown = document.getElementById(dropdownId);
    
    if (!dropdown) return;
    
    const pendingRequests = friendRequests.filter(r => r.status === 'pending');
    
    let html = `
      <div class="friends-dropdown-header">
        <div class="friends-dropdown-title">
          <i class="fas fa-user-friends"></i>
          <span>好友</span>
          ${friendMessagesCount > 0 ? `<span class="friends-message-count" style="background: #667eea; color: white; padding: 2px 6px; border-radius: 10px; font-size: 12px; margin-left: 8px;">${friendMessagesCount}</span>` : ''}
        </div>
      </div>
      
      <div class="friends-toolbar">
        <button class="friends-toolbar-btn ${currentView === 'friends' ? 'active' : ''}" data-action="show-friends">
          <i class="fas fa-users"></i>
          <span>好友列表</span>
        </button>
        <button class="friends-toolbar-btn" data-action="toggle-search">
          <i class="fas fa-user-plus"></i>
          <span>添加好友</span>
        </button>
        <button class="friends-toolbar-btn ${currentView === 'blacklist' ? 'active' : ''}" data-action="show-blacklist">
          <i class="fas fa-user-slash"></i>
          <span>黑名单</span>
        </button>
      </div>
      
      <div class="friends-search-box" id="friends-search-box">
        <input type="text" class="friends-search-input" id="friends-search-input" placeholder="搜索UID、用户名或昵称...">
        <i class="fas fa-search friends-search-icon"></i>
        <div class="friends-search-results" id="friends-search-results"></div>
      </div>
      
      <div class="friends-list-container">
    `;
    
    // 根据当前视图显示不同内容
    if (currentView === 'friends') {
      // 好友消息提示
      if (friendMessagesCount > 0) {
        html += `
          <div class="friends-messages-notification" style="background: #f0f2ff; padding: 12px; margin: 0 10px 10px 10px; border-radius: 8px; cursor: pointer;" onclick="openFriendMessagesCenter()">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center;">
                <i class="fas fa-envelope" style="color: #667eea; margin-right: 10px;"></i>
                <span style="color: #333;">您有 ${friendMessagesCount} 条好友未读消息</span>
              </div>
              <i class="fas fa-chevron-right" style="color: #667eea;"></i>
            </div>
          </div>
        `;
      }
      
      // 好友请求分组
      if (pendingRequests.length > 0) {
        html += `
          <div class="friends-group" id="requests-group">
            <div class="friends-group-header" data-group="requests">
              <div class="friends-group-title">
                <i class="fas fa-user-clock"></i>
                <span>好友请求</span>
                <span class="friends-group-count">${pendingRequests.length}</span>
              </div>
              <i class="fas fa-chevron-down friends-group-arrow"></i>
            </div>
            <div class="friends-group-content">
        `;
        
        pendingRequests.forEach(request => {
          html += renderFriendRequest(request);
        });
        
        html += `
            </div>
          </div>
        `;
      }
      
      // 好友列表
      html += `
        <div class="friends-group" id="friends-group">
          <div class="friends-group-header" data-group="friends">
            <div class="friends-group-title">
              <i class="fas fa-users"></i>
              <span>我的好友</span>
              <span class="friends-group-count">${friendsList.length}</span>
            </div>
            <i class="fas fa-chevron-down friends-group-arrow"></i>
          </div>
          <div class="friends-group-content">
      `;
      
      if (friendsList.length > 0) {
        friendsList.forEach(friend => {
          html += renderFriendItem(friend);
        });
      } else {
        html += `
          <div class="friends-empty">
            <i class="fas fa-user-friends"></i>
            <p>暂无好友</p>
          </div>
        `;
      }
      
      html += `
          </div>
        </div>
      `;
    } else if (currentView === 'blacklist') {
      // 黑名单视图
      html += `
        <div class="friends-group" id="blacklist-group">
          <div class="friends-group-header" data-group="blacklist">
            <div class="friends-group-title">
              <i class="fas fa-ban"></i>
              <span>黑名单</span>
              <span class="friends-group-count">${blacklist.length}</span>
            </div>
            <i class="fas fa-chevron-down friends-group-arrow"></i>
          </div>
          <div class="friends-group-content">
      `;
      
      if (blacklist.length > 0) {
        blacklist.forEach(user => {
          html += renderBlacklistItem(user);
        });
      } else {
        html += `
          <div class="friends-empty">
            <i class="fas fa-ban"></i>
            <p>黑名单为空</p>
          </div>
        `;
      }
      
      html += `
          </div>
        </div>
      `;
    }
    
    html += `
      </div>
    `;
    
    dropdown.innerHTML = html;
    
    // 绑定内部事件，传递type参数
    bindDropdownEvents(dropdown, type);
  }

  // 修复：绑定下拉菜单内部事件
  function bindDropdownEvents(dropdown, type) {
    // 工具栏按钮
    dropdown.querySelectorAll('.friends-toolbar-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const action = this.dataset.action;
        
        // 移除所有按钮的active类
        dropdown.querySelectorAll('.friends-toolbar-btn').forEach(b => b.classList.remove('active'));
        
        if (action === 'toggle-search') {
          toggleFriendsSearch();
        } else if (action === 'show-blacklist') {
          currentView = 'blacklist';
          this.classList.add('active');
          renderFriendsDropdown(type); // 修复：传递type参数
        } else if (action === 'show-friends') {
          currentView = 'friends';
          this.classList.add('active');
          renderFriendsDropdown(type); // 修复：传递type参数
        }
      });
    });
    
    // 搜索输入框
    const searchInput = dropdown.querySelector('.friends-search-input');
    if (searchInput) {
      searchInput.addEventListener('keyup', function(e) {
        e.stopPropagation();
        searchFriends(this.value);
      });
    }
    
    // 分组展开/收起
    dropdown.querySelectorAll('.friends-group-header').forEach(header => {
      header.addEventListener('click', function(e) {
        e.stopPropagation();
        const groupName = this.dataset.group;
        toggleGroup(groupName);
      });
    });
    
    // 好友请求按钮
    dropdown.querySelectorAll('.request-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const requestId = this.closest('.request-item').dataset.requestId;
        if (this.classList.contains('accept')) {
          acceptFriendRequest(requestId);
        } else if (this.classList.contains('reject')) {
          rejectFriendRequest(requestId);
        }
      });
    });
    
    // 好友项点击 - 修改为显示菜单而不是打开聊天
    dropdown.querySelectorAll('.friend-item').forEach(item => {
      item.addEventListener('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        
        // 先关闭所有其他菜单
        dropdown.querySelectorAll('.friend-actions-menu').forEach(menu => {
          if (menu !== this.querySelector('.friend-actions-menu')) {
            menu.style.display = 'none';
          }
        });
        
        // 切换当前菜单
        const menu = this.querySelector('.friend-actions-menu');
        if (menu) {
          menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        }
      });
    });
    
    // 聊天按钮点击
    dropdown.querySelectorAll('.chat-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const friendId = this.dataset.friendId;
        if (friendId) {
          openChatWithFriend(friendId);
          closeFriendsDropdown(); // 打开聊天后关闭下拉菜单
        }
      });
    });
    
    // 删除好友按钮点击
    dropdown.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const friendId = this.dataset.friendId;
        if (friendId && confirm('确定要删除该好友吗？')) {
          deleteFriend(friendId);
        }
      });
    });
    
    // 解除黑名单按钮
    dropdown.querySelectorAll('.unblock-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const userId = this.dataset.userId;
        if (userId) {
          unblockUser(userId);
        }
      });
    });
  }

  // 删除好友函数
  async function deleteFriend(friendId) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/friends/${friendId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        showSuccessMessage('已删除好友');
        await loadFriendsData(true);
        // 获取当前是移动端还是桌面端
        const dropdown = document.querySelector('.friends-dropdown-mobile.show') ? 'mobile' : 'desktop';
        renderFriendsDropdown(dropdown);
      }
    } catch (error) {
      console.error('删除好友失败:', error);
      showErrorMessage('操作失败');
    }
  }

  // 渲染好友请求
  function renderFriendRequest(request) {
    return `
      <div class="request-item" data-request-id="${request.id}">
        <div class="request-info">
          <img src="${request.sender_avatar || '/avatars/default_avatar.png'}" alt="" class="request-avatar">
          <div class="request-details">
            <div class="request-name">${escapeHtml(request.sender_name)}</div>
            <div class="request-time">${formatTime(request.created_at)}</div>
          </div>
        </div>
        ${request.message ? `<div class="request-message">${escapeHtml(request.message)}</div>` : ''}
        <div class="request-actions">
          <button class="request-btn accept">
            <i class="fas fa-check"></i> 接受
          </button>
          <button class="request-btn reject">
            <i class="fas fa-times"></i> 拒绝
          </button>
        </div>
      </div>
    `;
  }

  // 渲染好友项
  function renderFriendItem(friend) {
    // 添加在线状态样式类
    const onlineClass = friend.online ? 'online' : 'offline';
    const onlineStatusText = friend.online ? '在线' : '离线';
    
    return `
        <div class="friend-item ${onlineClass}" 
             data-friend-id="${friend.id}"
             data-friend-uid="${friend.uid}"
             data-friend-username="${friend.username}"
             data-friend-nickname="${friend.nickname || friend.username}"
             data-user-id="${friend.id}"
             data-user-uid="${friend.uid}"
             data-online="${friend.online}">
            <div class="friend-user-info" style="--user-rank-bg: url(${friend.rankBackground || ''})">
                <div class="friend-avatar-container">
                    ${friend.rankSp === 1 ? '<div class="friend-avatar-rainbow"></div>' : ''}
                    <img src="${friend.avatar || 'https://api.am-all.com.cn/avatars/default_avatar.png'}" 
                         alt="" class="friend-avatar">
                    ${friend.banState ? `<img src="https://oss.am-all.com.cn/asset/img/other/dc/banState/bs${friend.banState}.png" 
                                              class="friend-state-icon">` : ''}
                    <!-- 在线状态指示器 -->
                    <div class="online-indicator ${onlineClass}"></div>
                </div>
                <div class="friend-info">
                    <div class="friend-name">${friend.nickname || friend.username}</div>
                    <div class="friend-status">
                        <span class="online-status">${onlineStatusText}</span>
                        <span>UID: ${friend.uid}</span>
                    </div>
                </div>
                ${friend.userRank ? `<img src="https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_${friend.userRank + 1}.png" 
                                          class="friend-rank-icon">` : ''}
            </div>
            <!-- 好友操作菜单 -->
            <div class="friend-actions-menu" style="display: none;">
                <button class="friend-action-btn chat-btn" data-friend-id="${friend.id}">
                    <i class="fas fa-comment"></i> 聊天
                </button>
                <button class="friend-action-btn delete-btn" data-friend-id="${friend.id}">
                    <i class="fas fa-user-minus"></i> 删除好友
                </button>
            </div>
        </div>
    `;
  }

  // 渲染黑名单项
  function renderBlacklistItem(user) {
    const userRankBg = getUserRankBackground(user.user_rank);
    
    return `
      <div class="friend-item blacklist-item">
        <div class="friend-user-info" style="--user-rank-bg: ${userRankBg};">
          <div class="friend-avatar-container">
            <img src="${user.avatar || '/avatars/default_avatar.png'}" alt="" class="friend-avatar">
          </div>
          <div class="friend-info">
            <div class="friend-name">${escapeHtml(user.nickname || user.username)}</div>
            <div class="friend-status">
              <span>UID: ${user.uid}</span>
            </div>
          </div>
          <div class="blacklist-actions">
            <button class="unblock-btn" data-user-id="${user.id}">
              解除黑名单
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // 切换好友搜索
  function toggleFriendsSearch() {
    const searchBox = document.getElementById('friends-search-box');
    if (searchBox) {
      searchBox.classList.toggle('show');
      if (searchBox.classList.contains('show')) {
        const input = searchBox.querySelector('.friends-search-input');
        if (input) input.focus();
      }
    }
  }

  // 切换分组折叠
  function toggleGroup(groupId) {
    const group = document.getElementById(`${groupId}-group`);
    if (group) {
      group.classList.toggle('collapsed');
    }
  }

  // 搜索好友
  async function searchFriends(query) {
    const resultsDiv = document.getElementById('friends-search-results');
    
    if (query.length < 2) {
      resultsDiv.classList.remove('show');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/friends/search?q=${encodeURIComponent(query)}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const users = await response.json();
        renderSearchResults(users);
      }
    } catch (error) {
      console.error('搜索用户失败:', error);
    }
  }

  // 渲染搜索结果
  function renderSearchResults(users) {
    const resultsDiv = document.getElementById('friends-search-results');
    
    if (users.length === 0) {
      resultsDiv.innerHTML = '<div style="padding: 15px; text-align: center; color: #6c757d;">未找到用户</div>';
    } else {
      let html = '';
      users.forEach(user => {
        const isFriend = friendsList.some(f => f.id === user.id);
        const isBlocked = blacklist.some(b => b.id === user.id);
        
        html += `
          <div class="search-result-item" data-user-id="${user.id}">
            <img src="${user.avatar || '/avatars/default_avatar.png'}" alt="" class="search-result-avatar">
            <div class="search-result-info">
              <div class="search-result-name">${escapeHtml(user.nickname || user.username)}</div>
              <div class="search-result-uid">UID: ${user.uid}</div>
            </div>
            <div class="search-result-actions">
              ${!isFriend && !isBlocked ? `
                <button class="search-action-btn add-friend" data-user-id="${user.id}">
                  <i class="fas fa-user-plus"></i> 添加好友
                </button>
              ` : ''}
              ${!isBlocked ? `
                <button class="search-action-btn blacklist" data-user-id="${user.id}">
                  <i class="fas fa-ban"></i> 加入黑名单
                </button>
              ` : ''}
            </div>
          </div>
        `;
      });
      resultsDiv.innerHTML = html;
      
      // 绑定搜索结果的事件
      resultsDiv.querySelectorAll('.search-action-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          const userId = this.dataset.userId;
          if (this.classList.contains('add-friend')) {
            sendFriendRequest(userId);
          } else if (this.classList.contains('blacklist')) {
            addToBlacklist(userId);
          }
        });
      });
    }
    
    resultsDiv.classList.add('show');
  }

  // 发送好友请求
  async function sendFriendRequest(userId) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/friends/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          receiver_id: parseInt(userId, 10),  // 确保是整数
          message: ''  // 可选消息
        })
      });
      
      if (response.ok) {
        showSuccessMessage('好友请求已发送');
        const searchBox = document.getElementById('friends-search-box');
        if (searchBox) searchBox.classList.remove('show');
      } else {
        const error = await response.json();
        showErrorMessage(error.error || '发送失败');
      }
    } catch (error) {
      console.error('发送好友请求失败:', error);
      showErrorMessage('发送失败');
    }
  }

  // 接受好友请求
  async function acceptFriendRequest(requestId) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/friends/request/${requestId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        showSuccessMessage('已添加好友');
        await loadFriendsData(true);
        // 获取当前是移动端还是桌面端
        const dropdown = document.querySelector('.friends-dropdown-mobile.show') ? 'mobile' : 'desktop';
        renderFriendsDropdown(dropdown);
      }
    } catch (error) {
      console.error('接受好友请求失败:', error);
      showErrorMessage('操作失败');
    }
  }

  // 拒绝好友请求
  async function rejectFriendRequest(requestId) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/friends/request/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        showSuccessMessage('已拒绝请求');
        await loadFriendsData(true);
        // 获取当前是移动端还是桌面端
        const dropdown = document.querySelector('.friends-dropdown-mobile.show') ? 'mobile' : 'desktop';
        renderFriendsDropdown(dropdown);
      }
    } catch (error) {
      console.error('拒绝好友请求失败:', error);
      showErrorMessage('操作失败');
    }
  }

  // 加入黑名单
  async function addToBlacklist(userId) {
    if (!confirm('确定要将此用户加入黑名单吗？')) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/friends/blacklist`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ blocked_user_id: parseInt(userId) })
      });
      
      if (response.ok) {
        showSuccessMessage('已加入黑名单');
        await loadFriendsData(true);
        // 获取当前是移动端还是桌面端
        const dropdown = document.querySelector('.friends-dropdown-mobile.show') ? 'mobile' : 'desktop';
        renderFriendsDropdown(dropdown);
      }
    } catch (error) {
      console.error('加入黑名单失败:', error);
      showErrorMessage('操作失败');
    }
  }

  // 解除黑名单
  async function unblockUser(userId) {
    if (!confirm('确定要解除黑名单吗？')) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/friends/blacklist/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        showSuccessMessage('已解除黑名单');
        await loadFriendsData(true);
        // 获取当前是移动端还是桌面端
        const dropdown = document.querySelector('.friends-dropdown-mobile.show') ? 'mobile' : 'desktop';
        renderFriendsDropdown(dropdown);
      }
    } catch (error) {
      console.error('解除黑名单失败:', error);
      showErrorMessage('操作失败');
    }
  }

  // 打开与好友的聊天窗口
  function openChatWithFriend(friendId) {
    // 调用消息系统的聊天函数
    if (typeof window.openChatModal === 'function') {
      window.openChatModal(friendId);
      // 启动在线状态定期检查
      startChatOnlineStatusCheck(friendId);
    } else {
      console.error('聊天功能未初始化');
      showErrorMessage('聊天功能暂时不可用');
    }
  }

  // 新增：打开好友消息中心
  function openFriendMessagesCenter() {
    closeFriendsDropdown();
    
    // 跳转到消息中心页面，并筛选好友消息
    if (typeof window.loadPage === 'function') {
      window.loadPage('message-center', { filter: 'friends' });
    } else {
      window.location.hash = '#/message-center?filter=friends';
    }
  }

  // 显示通知
  function showNotification(title, message) {
    // 如果浏览器支持通知API
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico'
      });
    }
    
    // 同时显示页面内通知
    if (typeof window.showSuccessMessage === 'function') {
      window.showSuccessMessage(message);
    }
  }

  // 请求通知权限
  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  // 清理好友系统
  function cleanupFriendsSystem() {
    if (friendsCheckInterval) {
      clearInterval(friendsCheckInterval);
      friendsCheckInterval = null;
    }
    
    if (friendsStatusInterval) {
      clearInterval(friendsStatusInterval);
      friendsStatusInterval = null;
    }
    
    if (friendMessageCheckInterval) {
      clearInterval(friendMessageCheckInterval);
      friendMessageCheckInterval = null;
    }
    
    // 停止心跳
    stopHeartbeat();
    
    // 移除事件监听器
    window.removeEventListener('friendMessagesUpdate', handleFriendMessagesUpdate);
    
    // 移除好友图标
    const pcWrapper = document.getElementById('friends-icon-wrapper');
    const mobileWrapper = document.getElementById('friends-icon-wrapper-mobile');
    
    if (pcWrapper) pcWrapper.remove();
    if (mobileWrapper) mobileWrapper.remove();
    
    // 重置数据
    friendsList = [];
    blacklist = [];
    friendRequests = [];
    friendMessagesCount = 0;
    currentView = 'friends';
    isInitialized = false;
    isLoadingData = false;
    lastDataLoadTime = 0;
  }

  // 工具函数
  function getUserRankBackground(rank) {
    const backgrounds = {
      0: "url('https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_normal.png')",
      1: "url('https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_bronze.png')",
      2: "url('https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_silver.png')",
      3: "url('https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_gold.png')",
      4: "url('https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_platinum.png')",
      5: "url('https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_rainbow.png')"
    };
    return backgrounds[rank] || backgrounds[0];
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

  function showSuccessMessage(message) {
    if (typeof window.showSuccessMessage === 'function') {
      window.showSuccessMessage(message);
    } else {
      alert(message);
    }
  }

  function showErrorMessage(message) {
    if (typeof window.showErrorMessage === 'function') {
      window.showErrorMessage(message);
    } else {
      alert(message);
    }
  }

  // 暴露给全局
  global.initFriendsSystem = initFriendsSystem;
  global.cleanupFriendsSystem = cleanupFriendsSystem;
  global.loadFriendsData = loadFriendsData;
  global.openChatWithFriend = openChatWithFriend;
  global.openFriendMessagesCenter = openFriendMessagesCenter;
  global.requestNotificationPermission = requestNotificationPermission;
  global.updateFriendsOnlineStatus = updateFriendsOnlineStatus;
  global.updateFriendsMessageBadge = updateFriendsMessageBadge;
  global.checkFriendMessages = checkFriendMessages;
  global.logout = logout;  // 暴露登出函数
  global.startHeartbeat = startHeartbeat;  // 暴露心跳启动函数
  global.stopHeartbeat = stopHeartbeat;  // 暴露心跳停止函数
  
  // 确保在登录后立即初始化
  if (!window.friendsSystemInitialized) {
    window.friendsSystemInitialized = false;
    
    // 监听storage变化（登录时token会被设置）
    window.addEventListener('storage', function(e) {
      if (e.key === 'token' && e.newValue && !window.friendsSystemInitialized) {
        window.friendsSystemInitialized = true;
        setTimeout(initFriendsSystem, 100);
      }
    });
    
    // DOMContentLoaded时检查
    document.addEventListener('DOMContentLoaded', function() {
      requestNotificationPermission();
      
      setTimeout(function() {
        const token = localStorage.getItem('token');
        if (token && !window.friendsSystemInitialized) {
          window.friendsSystemInitialized = true;
          initFriendsSystem();
        }
      }, 300);
    });
    
    // 自定义登录事件
    window.addEventListener('userLoggedIn', function() {
      if (!window.friendsSystemInitialized) {
        window.friendsSystemInitialized = true;
        setTimeout(initFriendsSystem, 100);
        // 启动心跳
        startHeartbeat();
      }
    });
    
    // 登出事件
    window.addEventListener('userLoggedOut', function() {
      window.friendsSystemInitialized = false;
      // 停止心跳
      stopHeartbeat();
      cleanupFriendsSystem();
    });
  }

})(window);