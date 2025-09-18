// 好友功能JavaScript
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
  let isInitialized = false; // 防止重复初始化

  // 初始化好友系统
  function initFriendsSystem() {
    // 防止重复初始化
    if (isInitialized) return;
    
    // 先检查登录状态
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }
    
    isInitialized = true;
    
    // 添加好友图标到导航栏
    addFriendsIconToNavbar();
    
    // 加载好友数据
    loadFriendsData();
    
    // 设置定时检查
    if (friendsCheckInterval) {
      clearInterval(friendsCheckInterval);
    }
    friendsCheckInterval = setInterval(checkFriendRequests, 30000);
    
    // 绑定事件
    bindFriendsEvents();
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

  // 加载好友数据
  async function loadFriendsData() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      // 加载好友列表
      const friendsRes = await fetch(`${API_BASE_URL}/api/friends`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (friendsRes.ok) {
        const rawFriendsList = await friendsRes.json();
        // 处理好友数据，添加必要的字段
        friendsList = rawFriendsList.map(friend => {
          // 获取用户组背景
          const rankBackgrounds = {
            0: 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_normal.png',
            1: 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_bronze.png',
            2: 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_silver.png',
            3: 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_gold.png',
            4: 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_platinum.png',
            5: 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_rainbow.png'
          };
          
          // 确保rankSp字段正确（检查多种可能的字段名）
          const hasRainbowEffect = friend.rank_sp === 1 || friend.rankSp === 1 || friend.user_rank === 5;
          
          return {
            ...friend,
            userRank: friend.user_rank || 0,
            rankBackground: rankBackgrounds[friend.user_rank || 0],
            rankSp: hasRainbowEffect ? 1 : 0,  // 确保七彩光环标识正确
            banState: friend.ban_state || 0,
            avatar: friend.avatar || 'https://api.am-all.com.cn/avatars/default_avatar.png',
            online: friend.online || false
          };
        });
      } else {
        console.warn('加载好友列表失败:', friendsRes.status);
        friendsList = [];
      }
      
      // 加载黑名单
      const blacklistRes = await fetch(`${API_BASE_URL}/api/friends/blacklist`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (blacklistRes.ok) {
        blacklist = await blacklistRes.json();
      } else {
        console.warn('加载黑名单失败:', blacklistRes.status);
        blacklist = [];
      }
      
      // 加载好友请求
      const requestsRes = await fetch(`${API_BASE_URL}/api/friends/requests`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (requestsRes.ok) {
        friendRequests = await requestsRes.json();
      } else {
        console.warn('加载好友请求失败:', requestsRes.status);
        friendRequests = [];
      }
      
      updateFriendsBadge();
    } catch (error) {
      console.error('加载好友数据失败:', error);
      friendsList = [];
      blacklist = [];
      friendRequests = [];
      updateFriendsBadge();
    }
  }

  // 检查好友请求
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
        friendRequests = await response.json();
        updateFriendsBadge();
      }
    } catch (error) {
      console.error('检查好友请求失败:', error);
    }
  }

  // 更新好友请求徽章
  function updateFriendsBadge() {
    const pendingCount = friendRequests.filter(r => r.status === 'pending').length;
    const badge = document.getElementById('friends-badge');
    const mobileBadge = document.getElementById('friends-badge-mobile');
    
    [badge, mobileBadge].forEach(b => {
      if (b) {
        if (pendingCount > 0) {
          b.textContent = pendingCount > 99 ? '99+' : pendingCount;
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
        if (pendingCount > 0) {
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
          '.friends-group-header'
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

  // 打开好友下拉菜单
  async function openFriendsDropdown(type = 'desktop') {
    const dropdownId = type === 'mobile' ? 'friends-dropdown-mobile' : 'friends-dropdown';
    const dropdown = document.getElementById(dropdownId);
    
    if (!dropdown) return;
    
    await loadFriendsData();
    renderFriendsDropdown(type);
    dropdown.classList.add('show');
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
  }

  // 渲染好友下拉菜单
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
        </div>
      </div>
      
      <div class="friends-toolbar">
        <button class="friends-toolbar-btn" data-action="toggle-search">
          <i class="fas fa-user-plus"></i>
          <span>添加好友</span>
        </button>
        <button class="friends-toolbar-btn" data-action="toggle-blacklist">
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
    
    // 好友列表分组
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
    
    // 黑名单分组
    html += `
      <div class="friends-group collapsed" id="blacklist-group" style="display: none;">
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
    </div>
    `;
    
    dropdown.innerHTML = html;
    
    // 绑定内部事件
    bindDropdownEvents(dropdown);
  }

  // 绑定下拉菜单内部事件
  function bindDropdownEvents(dropdown) {
    // 工具栏按钮
    dropdown.querySelectorAll('.friends-toolbar-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const action = this.dataset.action;
        if (action === 'toggle-search') {
          toggleFriendsSearch();
        } else if (action === 'toggle-blacklist') {
          toggleBlacklist();
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

  // 添加删除好友函数
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
        await loadFriendsData();
        renderFriendsDropdown();
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
    return `
        <div class="friend-item" 
             data-friend-id="${friend.id}"
             data-friend-uid="${friend.uid}"
             data-friend-username="${friend.username}"
             data-friend-nickname="${friend.nickname || friend.username}"
             data-user-id="${friend.id}"
             data-user-uid="${friend.uid}">
            <div class="friend-user-info" style="--user-rank-bg: url(${friend.rankBackground || ''})">
                <div class="friend-avatar-container">
                    ${friend.rankSp === 1 ? '<div class="friend-avatar-rainbow"></div>' : ''}
                    <img src="${friend.avatar || 'https://api.am-all.com.cn/avatars/default_avatar.png'}" 
                         alt="" class="friend-avatar">
                    ${friend.banState ? `<img src="https://oss.am-all.com.cn/asset/img/other/dc/banState/bs${friend.banState}.png" 
                                              class="friend-state-icon">` : ''}
                </div>
                <div class="friend-info">
                    <div class="friend-name">${friend.nickname || friend.username}</div>
                    <div class="friend-status">
                        <span>${friend.online ? '在线' : '离线'}</span>
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

  // 切换黑名单显示
  function toggleBlacklist() {
    const blacklistGroup = document.getElementById('blacklist-group');
    const friendsGroup = document.getElementById('friends-group');
    
    if (blacklistGroup) {
      if (blacklistGroup.style.display === 'none') {
        blacklistGroup.style.display = 'block';
        if (friendsGroup) friendsGroup.style.display = 'none';
      } else {
        blacklistGroup.style.display = 'none';
        if (friendsGroup) friendsGroup.style.display = 'block';
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
        await loadFriendsData();
        renderFriendsDropdown();
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
        await loadFriendsData();
        renderFriendsDropdown();
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
        await loadFriendsData();
        renderFriendsDropdown();
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
        await loadFriendsData();
        renderFriendsDropdown();
      }
    } catch (error) {
      console.error('解除黑名单失败:', error);
      showErrorMessage('操作失败');
    }
  }

  // 打开与好友的聊天窗口 - 修复函数定义
  function openChatWithFriend(friendId) {
    // 调用消息系统的聊天函数
    if (typeof window.openChatModal === 'function') {
      window.openChatModal(friendId);
    } else {
      console.error('聊天功能未初始化');
      showErrorMessage('聊天功能暂时不可用');
    }
  }

  // 清理好友系统
  function cleanupFriendsSystem() {
    if (friendsCheckInterval) {
      clearInterval(friendsCheckInterval);
      friendsCheckInterval = null;
    }
    
    // 移除好友图标
    const pcWrapper = document.getElementById('friends-icon-wrapper');
    const mobileWrapper = document.getElementById('friends-icon-wrapper-mobile');
    
    if (pcWrapper) pcWrapper.remove();
    if (mobileWrapper) mobileWrapper.remove();
    
    // 重置数据
    friendsList = [];
    blacklist = [];
    friendRequests = [];
    isInitialized = false;
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
      }
    });
    
    // 登出事件
    window.addEventListener('userLoggedOut', function() {
      window.friendsSystemInitialized = false;
      cleanupFriendsSystem();
    });
  }

})(window);
