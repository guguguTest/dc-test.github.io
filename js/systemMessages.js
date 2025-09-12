// systemMessages.js - 系统消息管理模块
(function(global) {
    'use strict';
    
    let currentTemplates = [];
    let selectedRecipients = new Set();
    
    // 初始化系统消息管理页面
    function initSystemMessagesAdmin() {
        if (!ensureAdmin('site-admin')) return;
        
        const content = document.getElementById('content-container');
        if (!content) return;
        
        content.innerHTML = `
            <div class="section">
                <h1 class="page-title">系统消息管理</h1>
                <div class="admin-container">
                    <div class="breadcrumb">
                        <a href="#" data-page="site-admin">网站管理</a> / 
                        <span>系统消息管理</span>
                    </div>
                    
                    <div class="admin-tabs">
                        <button class="tab-btn active" data-tab="send">发送消息</button>
                        <button class="tab-btn" data-tab="templates">消息模板</button>
                        <button class="tab-btn" data-tab="history">发送历史</button>
                    </div>
                    
                    <div class="tab-content active" id="send-tab">
                        ${renderSendMessageTab()}
                    </div>
                    
                    <div class="tab-content" id="templates-tab">
                        ${renderTemplatesTab()}
                    </div>
                    
                    <div class="tab-content" id="history-tab">
                        ${renderHistoryTab()}
                    </div>
                </div>
            </div>
        `;
        
        setupSystemMessageEvents();
        loadTemplates();
    }
    
    // 渲染发送消息标签页
    function renderSendMessageTab() {
        return `
            <div class="admin-card">
                <h3>发送系统消息</h3>
                <form id="system-message-form" class="admin-form">
                    <div class="form-group">
                        <label>发送对象</label>
                        <div class="recipient-options">
                            <label class="radio-option">
                                <input type="radio" name="recipient-type" value="all" checked>
                                <span>全站用户</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="recipient-type" value="specific">
                                <span>指定用户</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="recipient-type" value="group">
                                <span>用户组</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group" id="specific-users-group" style="display: none;">
                        <label>选择用户（输入UID或用户名搜索）</label>
                        <div class="user-search-box">
                            <input type="text" id="user-search-input" placeholder="输入UID或用户名">
                            <button type="button" class="btn btn-sm btn-primary" id="search-user-btn">
                                <i class="fas fa-search"></i> 搜索
                            </button>
                        </div>
                        <div id="user-search-results" class="user-search-results"></div>
                        <div id="selected-users" class="selected-users">
                            <div class="selected-users-header">已选择用户：</div>
                            <div class="selected-users-list"></div>
                        </div>
                    </div>
                    
                    <div class="form-group" id="user-group-select" style="display: none;">
                        <label>选择用户组</label>
                        <select id="target-user-group" multiple>
                            <option value="0">普通用户</option>
                            <option value="1">初级用户</option>
                            <option value="2">中级用户</option>
                            <option value="3">高级用户</option>
                            <option value="4">贵宾用户</option>
                            <option value="5">管理员</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>消息类型</label>
                        <select id="message-type">
                            <option value="system">系统消息</option>
                            <option value="notification">通知</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>使用模板（可选）</label>
                        <select id="template-select">
                            <option value="">不使用模板</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>标题</label>
                        <input type="text" id="system-message-title" required maxlength="255">
                    </div>
                    
                    <div class="form-group">
                        <label>内容</label>
                        <textarea id="system-message-content" rows="8" required></textarea>
                        <div class="char-counter">
                            <span id="content-length">0</span> / 5000
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="checkbox-option">
                            <input type="checkbox" id="send-immediately" checked>
                            <span>立即发送</span>
                        </label>
                    </div>
                    
                    <div class="form-group" id="schedule-group" style="display: none;">
                        <label>定时发送</label>
                        <input type="datetime-local" id="schedule-time">
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" id="preview-message">
                            <i class="fas fa-eye"></i> 预览
                        </button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-paper-plane"></i> 发送消息
                        </button>
                    </div>
                </form>
            </div>
        `;
    }
    
    // 渲染消息模板标签页
    function renderTemplatesTab() {
        return `
            <div class="admin-card">
                <div class="templates-header">
                    <h3>自动消息模板</h3>
                    <button class="btn btn-primary" id="add-template-btn">
                        <i class="fas fa-plus"></i> 添加模板
                    </button>
                </div>
                <div class="templates-list" id="templates-list">
                    <div class="loading">加载中...</div>
                </div>
            </div>
        `;
    }
    
    // 渲染历史记录标签页
    function renderHistoryTab() {
        return `
            <div class="admin-card">
                <h3>发送历史</h3>
                <div class="history-filters">
                    <select id="history-type-filter">
                        <option value="">全部类型</option>
                        <option value="system">系统消息</option>
                        <option value="notification">通知</option>
                    </select>
                    <input type="date" id="history-date-from" placeholder="开始日期">
                    <input type="date" id="history-date-to" placeholder="结束日期">
                    <button class="btn btn-primary" id="filter-history">筛选</button>
                </div>
                <div class="history-list" id="history-list">
                    <div class="loading">加载中...</div>
                </div>
            </div>
        `;
    }
    
    // 设置事件监听
    function setupSystemMessageEvents() {
        // 标签切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                
                // 切换标签按钮状态
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // 切换内容
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(`${tab}-tab`).classList.add('active');
                
                // 加载对应数据
                if (tab === 'history') {
                    loadMessageHistory();
                } else if (tab === 'templates') {
                    loadTemplates();
                }
            });
        });
        
        // 发送对象切换
        document.querySelectorAll('input[name="recipient-type"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const type = e.target.value;
                document.getElementById('specific-users-group').style.display = 
                    type === 'specific' ? 'block' : 'none';
                document.getElementById('user-group-select').style.display = 
                    type === 'group' ? 'block' : 'none';
            });
        });
        
        // 用户搜索
        const searchBtn = document.getElementById('search-user-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', searchUsersForMessage);
        }
        
        const searchInput = document.getElementById('user-search-input');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    searchUsersForMessage();
                }
            });
        }
        
        // 模板选择
        const templateSelect = document.getElementById('template-select');
        if (templateSelect) {
            templateSelect.addEventListener('change', applyTemplate);
        }
        
        // 立即发送复选框
        const sendImmediately = document.getElementById('send-immediately');
        if (sendImmediately) {
            sendImmediately.addEventListener('change', (e) => {
                document.getElementById('schedule-group').style.display = 
                    e.target.checked ? 'none' : 'block';
            });
        }
        
        // 内容字数统计
        const contentTextarea = document.getElementById('system-message-content');
        if (contentTextarea) {
            contentTextarea.addEventListener('input', () => {
                document.getElementById('content-length').textContent = contentTextarea.value.length;
            });
        }
        
        // 预览按钮
        const previewBtn = document.getElementById('preview-message');
        if (previewBtn) {
            previewBtn.addEventListener('click', previewSystemMessage);
        }
        
        // 表单提交
        const form = document.getElementById('system-message-form');
        if (form) {
            form.addEventListener('submit', sendSystemMessage);
        }
        
        // 添加模板按钮
        const addTemplateBtn = document.getElementById('add-template-btn');
        if (addTemplateBtn) {
            addTemplateBtn.addEventListener('click', showAddTemplateModal);
        }
    }
    
    // 搜索用户
    async function searchUsersForMessage() {
        const query = document.getElementById('user-search-input').value.trim();
        if (!query) return;
        
        const token = localStorage.getItem('token');
        if (!token) return;
        
        try {
            const response = await fetch(`https://api.am-all.com.cn/api/admin/users/search?q=${encodeURIComponent(query)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const users = await response.json();
                displaySearchResults(users);
            }
        } catch (error) {
            console.error('搜索用户失败:', error);
            showErrorMessage('搜索用户失败');
        }
    }
    
    // 显示搜索结果
    function displaySearchResults(users) {
        const resultsDiv = document.getElementById('user-search-results');
        
        if (users.length === 0) {
            resultsDiv.innerHTML = '<div class="no-results">未找到用户</div>';
            return;
        }
        
        resultsDiv.innerHTML = users.map(user => `
            <div class="user-result-item">
                <img src="${user.avatar || 'https://api.am-all.com.cn/avatars/default_avatar.png'}" 
                     class="user-avatar-small" alt="">
                <div class="user-info">
                    <div>${escapeHtml(user.nickname || user.username)}</div>
                    <div class="user-uid">UID: ${user.uid}</div>
                </div>
                <button class="btn btn-sm btn-primary add-user-btn" 
                        data-id="${user.id}" 
                        data-name="${escapeHtml(user.nickname || user.username)}"
                        data-uid="${user.uid}">
                    添加
                </button>
            </div>
        `).join('');
        
        // 绑定添加按钮事件
        resultsDiv.querySelectorAll('.add-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                addRecipient(btn.dataset.id, btn.dataset.name, btn.dataset.uid);
            });
        });
    }
    
    // 添加收件人
    function addRecipient(userId, userName, uid) {
        if (selectedRecipients.has(userId)) {
            showErrorMessage('该用户已在列表中');
            return;
        }
        
        selectedRecipients.add(userId);
        
        const listDiv = document.querySelector('.selected-users-list');
        const userDiv = document.createElement('div');
        userDiv.className = 'selected-user-item';
        userDiv.dataset.id = userId;
        userDiv.innerHTML = `
            <span>${escapeHtml(userName)} (UID: ${uid})</span>
            <button class="remove-btn" data-id="${userId}">&times;</button>
        `;
        
        listDiv.appendChild(userDiv);
        
        userDiv.querySelector('.remove-btn').addEventListener('click', () => {
            selectedRecipients.delete(userId);
            userDiv.remove();
        });
    }
    
    // 加载消息模板
    async function loadTemplates() {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        try {
            const response = await fetch('https://api.am-all.com.cn/api/admin/message-templates', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const templates = await response.json();
                currentTemplates = templates;
                displayTemplates(templates);
                updateTemplateSelect(templates);
            }
        } catch (error) {
            console.error('加载模板失败:', error);
        }
    }
    
    // 显示模板列表
    function displayTemplates(templates) {
        const listDiv = document.getElementById('templates-list');
        if (!listDiv) return;
        
        if (templates.length === 0) {
            listDiv.innerHTML = '<div class="empty-state">暂无消息模板</div>';
            return;
        }
        
        listDiv.innerHTML = templates.map(template => `
            <div class="template-item">
                <div class="template-header">
                    <div>
                        <h4>${escapeHtml(template.title)}</h4>
                        <span class="event-type">${getEventTypeText(template.event_type)}</span>
                        <span class="message-type-badge ${template.message_type}">
                            ${getMessageTypeText(template.message_type)}
                        </span>
                    </div>
                    <div class="template-actions">
                        <label class="switch">
                            <input type="checkbox" ${template.enabled ? 'checked' : ''} 
                                   data-id="${template.id}">
                            <span class="slider"></span>
                        </label>
                        <button class="btn btn-sm btn-outline-primary edit-template" 
                                data-id="${template.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-template" 
                                data-id="${template.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="template-content">${escapeHtml(template.content)}</div>
            </div>
        `).join('');
        
        // 绑定事件
        listDiv.querySelectorAll('.switch input').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                toggleTemplate(e.target.dataset.id, e.target.checked);
            });
        });
        
        listDiv.querySelectorAll('.edit-template').forEach(btn => {
            btn.addEventListener('click', () => {
                editTemplate(btn.dataset.id);
            });
        });
        
        listDiv.querySelectorAll('.delete-template').forEach(btn => {
            btn.addEventListener('click', () => {
                deleteTemplate(btn.dataset.id);
            });
        });
    }
    
    // 发送系统消息
    async function sendSystemMessage(e) {
        e.preventDefault();
        
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const recipientType = document.querySelector('input[name="recipient-type"]:checked').value;
        const messageType = document.getElementById('message-type').value;
        const title = document.getElementById('system-message-title').value;
        const content = document.getElementById('system-message-content').value;
        
        let recipients = [];
        
        if (recipientType === 'specific') {
            recipients = Array.from(selectedRecipients);
            if (recipients.length === 0) {
                showErrorMessage('请选择至少一个收件人');
                return;
            }
        } else if (recipientType === 'group') {
            const selectedGroups = Array.from(document.getElementById('target-user-group').selectedOptions)
                .map(option => option.value);
            if (selectedGroups.length === 0) {
                showErrorMessage('请选择至少一个用户组');
                return;
            }
            recipients = { groups: selectedGroups };
        }
        
        const data = {
            recipient_type: recipientType,
            recipients: recipients,
            message_type: messageType,
            title: title,
            content: content
        };
        
        try {
            const response = await fetch('https://api.am-all.com.cn/api/admin/send-system-message', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                showSuccessMessage('系统消息发送成功');
                document.getElementById('system-message-form').reset();
                selectedRecipients.clear();
                document.querySelector('.selected-users-list').innerHTML = '';
            } else {
                const error = await response.json();
                showErrorMessage(error.error || '发送失败');
            }
        } catch (error) {
            console.error('发送系统消息失败:', error);
            showErrorMessage('发送系统消息失败');
        }
    }
    
    // 工具函数
    function getEventTypeText(type) {
        const types = {
            'register': '注册欢迎',
            'account_restricted': '账户受限',
            'account_banned': '账户封禁',
            'account_normal': '账户恢复'
        };
        return types[type] || type;
    }
    
    function getMessageTypeText(type) {
        const types = {
            'system': '系统',
            'notification': '通知'
        };
        return types[type] || type;
    }
    
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function ensureAdmin(pageId) {
        const token = localStorage.getItem('token');
        if (!token || !global.currentUser || global.currentUser.user_rank < 5) {
            if (typeof showErrorMessage === 'function') {
                showErrorMessage('需要管理员权限');
            }
            return false;
        }
        return true;
    }
    
    // 导出函数
    global.initSystemMessagesAdmin = initSystemMessagesAdmin;
    
})(window);