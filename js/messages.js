// messages.js - 改进版消息系统（使用命名空间，支持WebSocket）
(function(global) {
    'use strict';
    
    // 创建命名空间，避免全局变量污染
    const MessageSystem = {
        // 配置
        config: {
            apiUrl: 'https://api.am-all.com.cn',
            wsUrl: 'wss://api.am-all.com.cn',
            pollingInterval: 30000, // 30秒
            reconnectDelay: 5000, // 5秒
            maxReconnectAttempts: 5
        },
        
        // 状态
        state: {
            unreadCount: 0,
            currentThread: null,
            selectedMessages: new Set(),
            messagePollingInterval: null,
            currentChatUserId: null,
            ws: null,
            wsReconnectTimer: null,
            reconnectAttempts: 0,
            isInitialized: false
        },
        
        // 初始化系统
        init() {
            if (this.state.isInitialized) return;
            
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('No token found, skipping message system initialization');
                return;
            }
            
            this.state.isInitialized = true;
            this.addMessageIcons();
            this.requestNotificationPermission();
            this.initConnection();
            this.updateUnreadCount();
        },
        
        // 初始化连接（优先WebSocket，回退到轮询）
        initConnection() {
            // 先尝试WebSocket
            if (window.WebSocket && this.config.wsUrl) {
                this.initWebSocket();
            } else {
                // 不支持WebSocket，直接使用轮询
                this.startPolling();
            }
        },
        
        // 初始化WebSocket连接
        initWebSocket() {
            const token = localStorage.getItem('token');
            if (!token || this.state.ws) return;
            
            try {
                this.state.ws = new WebSocket(`${this.config.wsUrl}/ws?token=${encodeURIComponent(token)}`);
                
                this.state.ws.onopen = () => {
                    console.log('WebSocket connection established');
                    this.state.reconnectAttempts = 0;
                    clearTimeout(this.state.wsReconnectTimer);
                    
                    // 停止轮询（如果在运行）
                    this.stopPolling();
                };
                
                this.state.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleWebSocketMessage(data);
                    } catch (error) {
                        console.error('Error parsing WebSocket message:', error);
                    }
                };
                
                this.state.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                };
                
                this.state.ws.onclose = (event) => {
                    console.log('WebSocket connection closed', event.code, event.reason);
                    this.state.ws = null;
                    this.handleWebSocketClose();
                };
                
            } catch (error) {
                console.error('Failed to create WebSocket connection:', error);
                this.startPolling();
            }
        },
        
        // 处理WebSocket消息
        handleWebSocketMessage(data) {
            switch (data.type) {
                case 'new_message':
                    this.state.unreadCount++;
                    this.updateUnreadBadge(this.state.unreadCount);
                    this.showNotification(data.message);
                    
                    // 如果消息列表打开，刷新它
                    if (document.getElementById('messages-tbody')) {
                        this.loadMessages();
                    }
                    break;
                    
                case 'message_read':
                    this.updateUnreadCount();
                    break;
                    
                case 'ping':
                    // 心跳响应
                    if (this.state.ws && this.state.ws.readyState === WebSocket.OPEN) {
                        this.state.ws.send(JSON.stringify({ type: 'pong' }));
                    }
                    break;
            }
        },
        
        // 处理WebSocket关闭
		handleWebSocketClose() {
			if (this.state.reconnectAttempts < this.config.maxReconnectAttempts) {
				this.state.reconnectAttempts++;
				// 递增延迟：第1次5秒，第2次10秒，第3次15秒...最多30秒
				const delay = Math.min(this.config.reconnectDelay * this.state.reconnectAttempts, 30000);
				
				console.log(`Attempting to reconnect in ${delay/1000}s... (${this.state.reconnectAttempts}/${this.config.maxReconnectAttempts})`);
				
				this.state.wsReconnectTimer = setTimeout(() => {
					this.initWebSocket();
				}, delay);
			} else {
				console.log('Max reconnection attempts reached, falling back to polling');
				this.startPolling();
			}
		},
        
        // 开始轮询
        startPolling() {
            if (this.state.messagePollingInterval) return;
            
            console.log('Starting message polling');
            this.state.messagePollingInterval = setInterval(() => {
                this.updateUnreadCount();
            }, this.config.pollingInterval);
        },
        
        // 停止轮询
        stopPolling() {
            if (this.state.messagePollingInterval) {
                clearInterval(this.state.messagePollingInterval);
                this.state.messagePollingInterval = null;
                console.log('Stopped message polling');
            }
        },
        
        // 清理资源
        cleanup() {
            this.stopPolling();
            
            if (this.state.ws) {
                this.state.ws.close();
                this.state.ws = null;
            }
            
            if (this.state.wsReconnectTimer) {
                clearTimeout(this.state.wsReconnectTimer);
                this.state.wsReconnectTimer = null;
            }
            
            this.state.isInitialized = false;
        },
        
        // 请求通知权限
        requestNotificationPermission() {
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission().then(permission => {
                    console.log('Notification permission:', permission);
                });
            }
        },
        
        // 显示通知
        showNotification(message) {
            if (!message) return;
            
            // 浏览器通知
            if ('Notification' in window && Notification.permission === 'granted') {
                const notification = new Notification(message.title || '新消息', {
                    body: message.content || '',
                    icon: '/favicon.ico',
                    tag: `message-${message.id}`,
                    requireInteraction: false
                });
                
                notification.onclick = () => {
                    window.focus();
                    if (message.id) {
                        this.showMessageDetail(message.id);
                    }
                    notification.close();
                };
                
                // 5秒后自动关闭
                setTimeout(() => notification.close(), 5000);
            }
            
            // 页面内通知（可选）
            if (typeof showSuccessMessage === 'function') {
                showSuccessMessage(`新消息: ${message.title || '未命名'}`);
            }
        },
        
        // 更新未读数量
        async updateUnreadCount() {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            try {
                const response = await fetch(`${this.config.apiUrl}/api/messages/unread-count`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.state.unreadCount = data.count || 0;
                    this.updateUnreadBadge(this.state.unreadCount);
                }
            } catch (error) {
                console.error('Failed to update unread count:', error);
            }
        },
        
        // 更新未读标记UI
        updateUnreadBadge(count) {
            const badges = document.querySelectorAll('.unread-badge');
            badges.forEach(badge => {
                if (count > 0) {
                    badge.textContent = count > 99 ? '99+' : count;
                    badge.style.display = 'block';
                } else {
                    badge.style.display = 'none';
                }
            });
            
            // 更新页面标题
            const originalTitle = document.title.replace(/^\(\d+\) /, '');
            document.title = count > 0 ? `(${count}) ${originalTitle}` : originalTitle;
        },
        
        // 添加消息图标到导航栏
        addMessageIcons() {
            // 检查是否已添加
            if (document.getElementById('message-icon-pc')) return;
            
            // PC端图标
            const pcNavLeft = document.querySelector('.navbar-left');
            if (pcNavLeft) {
                const messageIconHtml = `
                    <div class="message-icon-wrapper" id="message-icon-pc">
                        <i class="fas fa-envelope message-icon"></i>
                        <span class="unread-badge" style="display: none;">0</span>
                        <div class="message-dropdown" style="display: none;">
                            <div class="message-dropdown-header">
                                <span>消息</span>
                                <a href="#" class="mark-all-read">全部已读</a>
                            </div>
                            <div class="message-dropdown-list"></div>
                            <div class="message-dropdown-footer">
                                <a href="#" data-page="messages">查看更多消息</a>
                            </div>
                        </div>
                    </div>
                `;
                pcNavLeft.insertAdjacentHTML('afterbegin', messageIconHtml);
                this.setupPCIconEvents();
            }
            
            // 移动端图标
            const mobileNav = document.querySelector('.navbar-mobile');
            if (mobileNav) {
                const sidebarToggle = mobileNav.querySelector('.sidebar-toggle');
                const messageIconHtml = `
                    <div class="message-icon-wrapper" id="message-icon-mobile">
                        <i class="fas fa-envelope message-icon"></i>
                        <span class="unread-badge" style="display: none;">0</span>
                    </div>
                `;
                if (sidebarToggle) {
                    sidebarToggle.insertAdjacentHTML('afterend', messageIconHtml);
                    this.setupMobileIconEvents();
                }
            }
        },
        
        // 设置PC端图标事件
        setupPCIconEvents() {
            const pcIcon = document.getElementById('message-icon-pc');
            if (!pcIcon) return;
            
            const icon = pcIcon.querySelector('.message-icon');
            const dropdown = pcIcon.querySelector('.message-dropdown');
            
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                const isVisible = dropdown.style.display !== 'none';
                dropdown.style.display = isVisible ? 'none' : 'block';
                if (!isVisible) {
                    this.loadRecentMessages();
                }
            });
            
            // 点击外部关闭
            document.addEventListener('click', (e) => {
                if (!pcIcon.contains(e.target)) {
                    dropdown.style.display = 'none';
                }
            });
            
            // 全部已读
            const markAllRead = pcIcon.querySelector('.mark-all-read');
            if (markAllRead) {
                markAllRead.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.markAllMessagesAsRead();
                });
            }
            
            // 查看更多
            const viewMore = pcIcon.querySelector('[data-page="messages"]');
            if (viewMore) {
                viewMore.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (typeof loadPage === 'function') {
                        loadPage('messages');
                        dropdown.style.display = 'none';
                    }
                });
            }
        },
        
        // 设置移动端图标事件
        setupMobileIconEvents() {
            const mobileIcon = document.getElementById('message-icon-mobile');
            if (!mobileIcon) return;
            
            mobileIcon.addEventListener('click', () => {
                if (typeof loadPage === 'function') {
                    loadPage('messages');
                }
            });
        },
        
        // 加载最近消息
        async loadRecentMessages() {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            const listContainer = document.querySelector('.message-dropdown-list');
            if (!listContainer) return;
            
            listContainer.innerHTML = '<div class="loading">加载中...</div>';
            
            try {
                const response = await fetch(`${this.config.apiUrl}/api/messages/recent?limit=5`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const messages = await response.json();
                    this.displayRecentMessages(messages);
                }
            } catch (error) {
                console.error('Failed to load recent messages:', error);
                listContainer.innerHTML = '<div class="error">加载失败</div>';
            }
        },
        
        // 显示最近消息
        displayRecentMessages(messages) {
            const listContainer = document.querySelector('.message-dropdown-list');
            if (!listContainer) return;
            
            if (messages.length === 0) {
                listContainer.innerHTML = '<div class="no-messages">暂无消息</div>';
                return;
            }
            
            listContainer.innerHTML = messages.map(msg => `
                <div class="message-item ${!msg.is_read ? 'unread' : ''}" data-id="${msg.id}">
                    <div class="message-item-header">
                        <span class="message-type-badge ${msg.message_type}">
                            ${this.getMessageTypeText(msg.message_type)}
                        </span>
                        <span class="message-time">${this.formatTime(msg.created_at)}</span>
                    </div>
                    <div class="message-title">${this.escapeHtml(msg.title)}</div>
                </div>
            `).join('');
            
            // 绑定点击事件
            listContainer.querySelectorAll('.message-item').forEach(item => {
                item.addEventListener('click', () => {
                    const messageId = item.dataset.id;
                    this.showMessageDetail(messageId);
                    
                    // 关闭下拉菜单
                    const dropdown = document.querySelector('.message-dropdown');
                    if (dropdown) dropdown.style.display = 'none';
                });
            });
        },
        
        // 标记所有消息已读
        async markAllMessagesAsRead() {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            try {
                const response = await fetch(`${this.config.apiUrl}/api/messages/mark-all-read`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    this.state.unreadCount = 0;
                    this.updateUnreadBadge(0);
                    
                    if (typeof showSuccessMessage === 'function') {
                        showSuccessMessage('所有消息已标记为已读');
                    }
                    
                    // 刷新消息列表
                    this.loadRecentMessages();
                }
            } catch (error) {
                console.error('Failed to mark all as read:', error);
                if (typeof showErrorMessage === 'function') {
                    showErrorMessage('操作失败');
                }
            }
        },
        
        // 显示消息详情（由其他模块实现）
        showMessageDetail(messageId) {
            if (typeof global.showMessageDetail === 'function') {
                global.showMessageDetail(messageId);
            } else {
                console.error('showMessageDetail function not found');
            }
        },
        
        // 工具函数
        getMessageTypeText(type) {
            const types = {
                'system': '系统',
                'message': '消息',
                'notification': '通知'
            };
            return types[type] || type;
        },
        
        formatTime(timestamp) {
            const date = new Date(timestamp);
            const now = new Date();
            const diff = now - date;
            
            if (diff < 60000) return '刚刚';
            if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
            if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
            if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';
            
            return date.toLocaleDateString();
        },
        
        escapeHtml(text) {
            if (text == null) return '';
            const div = document.createElement('div');
            div.textContent = String(text);
            return div.innerHTML;
        },
        
        // 安全的URL处理
        sanitizeUrl(url) {
            if (!url) return 'https://api.am-all.com.cn/avatars/default_avatar.png';
            
            try {
                const parsed = new URL(url);
                if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
                    return 'https://api.am-all.com.cn/avatars/default_avatar.png';
                }
                return url;
            } catch {
                return 'https://api.am-all.com.cn/avatars/default_avatar.png';
            }
        }
    };
    
    // 暴露给全局
    global.MessageSystem = MessageSystem;
    
    // 向后兼容的函数
    global.initMessageSystem = () => MessageSystem.init();
    global.stopMessagePolling = () => MessageSystem.cleanup();
    
    // 自动初始化（当DOM加载完成后）
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const token = localStorage.getItem('token');
            if (token) {
                MessageSystem.init();
            }
        });
    } else {
        const token = localStorage.getItem('token');
        if (token) {
            MessageSystem.init();
        }
    }
    
    // 页面卸载时清理
    window.addEventListener('beforeunload', () => {
        MessageSystem.cleanup();
    });
    
})(window);