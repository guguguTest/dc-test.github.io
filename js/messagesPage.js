// messagesPage.js - 消息页面主功能
(function(global) {
    'use strict';
    
    let currentPage = 1;
    let messagesPerPage = 20;
    let allMessages = [];
    let selectedMessages = new Set();
    let currentThread = null;
    let chatPollingInterval = null;
	let searchDebounceTimer;

	function debounce(func, delay) {
		return function(...args) {
			clearTimeout(searchDebounceTimer);
			searchDebounceTimer = setTimeout(() => func.apply(this, args), delay);
		};
	}
    
    // 初始化消息页面
    function initMessagesPage() {
        const content = document.getElementById('content-container');
        if (!content) return;
        
        content.innerHTML = `
            <div class="section">
                <h1 class="page-title">消息中心</h1>
                <div class="messages-container">
                    <div class="messages-toolbar">
                        <button class="btn btn-primary" id="compose-message">
                            <i class="fas fa-edit"></i> 发消息
                        </button>
                        <button class="btn btn-outline-secondary" id="select-all">
                            <i class="fas fa-check-square"></i> 全选
                        </button>
                        <button class="btn btn-outline-danger" id="delete-selected" disabled>
                            <i class="fas fa-trash"></i> 删除
                        </button>
                        <button class="btn btn-outline-info" id="mark-all-read">
                            <i class="fas fa-envelope-open"></i> 全部已读
                        </button>
                        <div class="messages-filter">
                            <select id="message-type-filter">
                                <option value="">全部类型</option>
                                <option value="system">系统消息</option>
                                <option value="message">用户消息</option>
                                <option value="notification">通知</option>
                            </select>
                        </div>
                    </div>
                    <div class="messages-list">
                        <table class="messages-table">
                            <thead>
                                <tr>
                                    <th width="40">
                                        <input type="checkbox" id="select-all-checkbox">
                                    </th>
                                    <th width="80">类型</th>
                                    <th>标题</th>
                                    <th width="150">发送者</th>
                                    <th width="120">时间</th>
                                    <th width="60">操作</th>
                                </tr>
                            </thead>
                            <tbody id="messages-tbody">
                                <tr>
                                    <td colspan="6" class="loading">加载中...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="messages-pagination" id="messages-pagination"></div>
                </div>
            </div>
        `;
        
        setupMessagePageEvents();
        loadMessages();
    }
    
    // 设置消息页面事件
    function setupMessagePageEvents() {
        // 发消息按钮
        const composeBtn = document.getElementById('compose-message');
        if (composeBtn) {
            composeBtn.addEventListener('click', showComposeModal);
        }
        
        // 全选
        const selectAllBtn = document.getElementById('select-all');
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', toggleSelectAll);
        }
        
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', toggleSelectAll);
        }
        
        // 删除选中
        const deleteBtn = document.getElementById('delete-selected');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', deleteSelectedMessages);
        }
        
        // 全部已读
        const markAllReadBtn = document.getElementById('mark-all-read');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', markAllAsRead);
        }
        
        // 类型筛选
        const typeFilter = document.getElementById('message-type-filter');
        if (typeFilter) {
            typeFilter.addEventListener('change', () => {
                currentPage = 1;
                loadMessages();
            });
        }
    }
    
    // 加载消息列表
    async function loadMessages() {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const typeFilter = document.getElementById('message-type-filter')?.value || '';
        let url = `https://api.am-all.com.cn/api/messages?page=${currentPage}&limit=${messagesPerPage}`;
        if (typeFilter) {
            url += `&type=${typeFilter}`;
        }
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                allMessages = data.messages;
                renderMessages(data.messages);
                renderPagination(data.pagination);
            }
        } catch (error) {
            console.error('加载消息失败:', error);
            showErrorMessage('加载消息失败');
        }
    }
    
    // 渲染消息列表
    function renderMessages(messages) {
        const tbody = document.getElementById('messages-tbody');
        if (!tbody) return;
        
        if (messages.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>暂无消息</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = messages.map(msg => `
            <tr class="message-row ${!msg.is_read ? 'unread' : ''}" data-id="${msg.id}">
                <td>
                    <input type="checkbox" class="message-checkbox" value="${msg.id}">
                </td>
                <td>
                    <span class="message-type-badge ${msg.message_type}">
                        ${getMessageTypeText(msg.message_type)}
                    </span>
                </td>
                <td class="message-title" data-id="${msg.id}">
                    ${!msg.is_read ? '<i class="fas fa-circle unread-dot"></i>' : ''}
                    ${escapeHtml(msg.title)}
                </td>
                <td class="message-sender">
                    ${msg.sender ? `
                        <div class="sender-info">
                            <img src="${msg.sender.avatar || 'https://api.am-all.com.cn/avatars/default_avatar.png'}" 
                                 class="sender-avatar" alt="">
                            <span>${escapeHtml(msg.sender.nickname || msg.sender.username)}</span>
                        </div>
                    ` : '<span class="system-sender">系统</span>'}
                </td>
                <td class="message-time">${formatTime(msg.created_at)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger delete-message" data-id="${msg.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        // 绑定事件
        tbody.querySelectorAll('.message-title').forEach(title => {
            title.addEventListener('click', () => {
                showMessageDetail(title.dataset.id);
            });
        });
        
        tbody.querySelectorAll('.message-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', updateSelectedMessages);
        });
        
        tbody.querySelectorAll('.delete-message').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteMessage(btn.dataset.id);
            });
        });
    }
    
    // 显示消息详情
    async function showMessageDetail(messageId) {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        try {
            const response = await fetch(`https://api.am-all.com.cn/api/messages/${messageId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const message = await response.json();
                
                // 标记为已读
                if (!message.is_read) {
                    markAsRead(messageId);
                }
                
                // 根据消息类型显示不同界面
                if (message.message_type === 'message') {
                    showChatModal(message);
                } else {
                    showReadOnlyModal(message);
                }
            }
        } catch (error) {
            console.error('获取消息详情失败:', error);
            showErrorMessage('获取消息详情失败');
        }
    }
    
    // 显示聊天模式弹窗
    function showChatModal(message) {
        const modalHtml = `
            <div id="chat-modal" class="modal show">
                <div class="modal-content chat-modal">
                    <div class="modal-header">
                        <div class="chat-header">
                            <img src="${message.sender?.avatar || 'https://api.am-all.com.cn/avatars/default_avatar.png'}" 
                                 class="chat-avatar" alt="">
                            <div class="chat-user-info">
                                <h5>${escapeHtml(message.sender?.nickname || message.sender?.username || '用户')}</h5>
                                <span class="chat-status">在线</span>
                            </div>
                        </div>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="chat-messages" id="chat-messages">
                            <div class="chat-message received">
                                <div class="message-content">
                                    <div class="message-text">${escapeHtml(message.content)}</div>
                                    <div class="message-time">${formatTime(message.created_at)}</div>
                                </div>
                            </div>
                        </div>
                        <div class="chat-input-area">
                            <textarea id="chat-input" placeholder="输入消息..." rows="3"></textarea>
                            <button id="send-chat" class="btn btn-primary">
                                <i class="fas fa-paper-plane"></i> 发送
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = document.getElementById('chat-modal');
        
        // 加载聊天历史
        loadChatHistory(message.id);
        
        // 设置当前聊天线程
        currentThread = message.thread_id || message.id;
        
        // 开始轮询新消息
        startChatPolling();
        
        // 绑定事件
        modal.querySelector('.modal-close').addEventListener('click', () => {
            closeChatModal();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeChatModal();
            }
        });
        
        const sendBtn = document.getElementById('send-chat');
        const chatInput = document.getElementById('chat-input');
        
        sendBtn.addEventListener('click', sendChatMessage);
        
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }
    
    // 显示只读消息弹窗
    function showReadOnlyModal(message) {
        const modalHtml = `
            <div id="message-detail-modal" class="modal show">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5>${escapeHtml(message.title)}</h5>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="message-detail-meta">
                            <span class="message-type-badge ${message.message_type}">
                                ${getMessageTypeText(message.message_type)}
                            </span>
                            <span class="message-time">${formatTime(message.created_at)}</span>
                        </div>
                        <div class="message-detail-content">
                            ${escapeHtml(message.content).replace(/\n/g, '<br>')}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" id="close-detail">确认</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = document.getElementById('message-detail-modal');
        
        // 绑定事件
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('#close-detail').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    // 显示撰写消息弹窗
    function showComposeModal() {
        const modalHtml = `
            <div id="compose-modal" class="modal show">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5>发送消息</h5>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>收件人</label>
                            <div class="recipient-search">
                                <input type="text" id="recipient-input" 
                                       placeholder="输入用户昵称或UID搜索">
                                <div id="user-suggestions" class="user-suggestions"></div>
                            </div>
                            <div id="selected-recipient" class="selected-recipient"></div>
                        </div>
                        <div class="form-group">
                            <label>标题</label>
                            <input type="text" id="message-title" placeholder="输入消息标题">
                        </div>
                        <div class="form-group">
                            <label>内容</label>
                            <textarea id="message-content" rows="5" placeholder="输入消息内容"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="cancel-compose">取消</button>
                        <button class="btn btn-primary" id="send-message">发送</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = document.getElementById('compose-modal');
        
        // 设置用户搜索
        setupUserSearch();
        
        // 绑定事件
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('#cancel-compose').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('#send-message').addEventListener('click', sendNewMessage);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    // 设置用户搜索
	function setupUserSearch() {
		const input = document.getElementById('recipient-input');
		const suggestions = document.getElementById('user-suggestions');
		
		// 使用防抖处理输入
		const debouncedSearch = debounce((query) => {
			if (query.length < 2) {
				suggestions.style.display = 'none';
				return;
			}
			searchUsers(query);
		}, 300);
		
		input.addEventListener('input', (e) => {
			const query = e.target.value.trim();
			debouncedSearch(query);
		});
		
		// 点击外部关闭建议列表
		document.addEventListener('click', (e) => {
			if (!e.target.closest('.recipient-search')) {
				suggestions.style.display = 'none';
			}
		});
	}
    
    // 搜索用户
    async function searchUsers(query) {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        try {
            const response = await fetch(`https://api.am-all.com.cn/api/users/search?q=${encodeURIComponent(query)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const users = await response.json();
                displayUserSuggestions(users);
            }
        } catch (error) {
            console.error('搜索用户失败:', error);
        }
    }
    
    // 显示用户建议
    function displayUserSuggestions(users) {
        const suggestions = document.getElementById('user-suggestions');
        
        if (users.length === 0) {
            suggestions.innerHTML = '<div class="no-results">未找到用户</div>';
            suggestions.style.display = 'block';
            return;
        }
        
        suggestions.innerHTML = users.map(user => `
            <div class="user-suggestion" data-id="${user.id}" data-name="${escapeHtml(user.nickname || user.username)}">
                <img src="${user.avatar || 'https://api.am-all.com.cn/avatars/default_avatar.png'}" alt="">
                <div class="user-info">
                    <div class="user-name">${escapeHtml(user.nickname || user.username)}</div>
                    <div class="user-uid">UID: ${user.uid}</div>
                </div>
            </div>
        `).join('');
        
        suggestions.style.display = 'block';
        
        // 绑定选择事件
        suggestions.querySelectorAll('.user-suggestion').forEach(item => {
            item.addEventListener('click', () => {
                selectRecipient(item.dataset.id, item.dataset.name);
                suggestions.style.display = 'none';
                document.getElementById('recipient-input').value = '';
            });
        });
    }
    
    // 选择收件人
    function selectRecipient(userId, userName) {
        const container = document.getElementById('selected-recipient');
        container.innerHTML = `
            <div class="selected-user" data-id="${userId}">
                <span>${escapeHtml(userName)}</span>
                <button class="remove-recipient">&times;</button>
            </div>
        `;
        
        container.querySelector('.remove-recipient').addEventListener('click', () => {
            container.innerHTML = '';
        });
    }
    
    // 工具函数
    function getMessageTypeText(type) {
        const types = {
            'system': '系统',
            'message': '消息',
            'notification': '通知'
        };
        return types[type] || type;
    }
    
    function formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('zh-CN');
    }
    
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 导出函数
    global.initMessagesPage = initMessagesPage;
    global.showMessageDetail = showMessageDetail;
    
})(window);