// 系统消息管理
(function(global) {
  'use strict';

  // 确保API_BASE_URL存在
  if (typeof window.API_BASE_URL === 'undefined') {
    window.API_BASE_URL = 'https://api.am-all.com.cn';
  }
  const API_BASE_URL = window.API_BASE_URL;

  // 渲染系统消息管理页面
  async function renderSystemMessageAdmin() {
    const container = document.getElementById('content-container');
    if (!container) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      showLoginRequired('system-message-admin');
      return;
    }
    
    container.innerHTML = `
      <div class="system-message-admin">
        <div class="message-center-header">
          <h1 class="message-center-title">系统消息管理</h1>
          <div class="message-actions">
            <button class="message-btn message-btn-primary" onclick="openSystemMessageModal()">
              <i class="fas fa-plus"></i> 新建消息
            </button>
            <button class="message-btn message-btn-secondary" onclick="showAutoMessageSettings()">
              <i class="fas fa-cog"></i> 自动消息设置
            </button>
          </div>
        </div>
        
        <div class="admin-message-form" id="system-message-form" style="display: none;">
          <h3>发送系统消息</h3>
          <div class="form-group">
            <label>消息类型</label>
            <select class="form-control" id="system-msg-type">
              <option value="notification">通知</option>
              <option value="system">系统消息</option>
              <option value="auto">自动消息</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>发送范围</label>
            <select class="form-control" id="system-msg-target" onchange="handleTargetChange()">
              <option value="all">全站用户</option>
              <option value="user">指定用户</option>
            </select>
          </div>
          
          <div class="form-group" id="user-select-group" style="display: none;">
            <label>用户UID</label>
            <input type="text" class="form-control" id="target-uid" placeholder="请输入用户UID">
            <div id="uid-search-result" style="margin-top: 10px;"></div>
          </div>
          
          <div class="form-group">
            <label>消息标题</label>
            <input type="text" class="form-control" id="system-msg-title" placeholder="请输入消息标题">
          </div>
          
          <div class="form-group">
            <label>消息内容</label>
            <textarea class="form-control textarea" id="system-msg-content" placeholder="请输入消息内容"></textarea>
          </div>
          
          <div class="form-group">
            <button class="message-btn message-btn-primary" onclick="sendSystemMessage()">
              <i class="fas fa-paper-plane"></i> 发送
            </button>
            <button class="message-btn message-btn-secondary" onclick="closeSystemMessageModal()">
              取消
            </button>
          </div>
        </div>
        
        <h3 class="system-message-list-title">
          已发送的系统消息
        </h3>
        <div class="message-table">
          <table>
            <thead>
              <tr>
                <th width="100">类型</th>
                <th>标题</th>
                <th width="150">目标</th>
                <th width="150">发送时间</th>
                <th width="100">操作</th>
              </tr>
            </thead>
            <tbody id="system-message-list">
              <tr>
                <td colspan="5" style="text-align: center; padding: 40px;">
                  <i class="fas fa-spinner fa-spin"></i> 加载中...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    loadSystemMessages();
  }

  // 显示自动消息设置弹窗
  function showAutoMessageSettings() {
    // 检查是否已存在弹窗
    let modal = document.getElementById('auto-message-modal');
    
    if (!modal) {
      // 创建弹窗HTML
      const modalHTML = `
        <div id="auto-message-modal" class="auto-message-modal">
          <div class="auto-message-container">
            <div class="auto-message-header">
              <h3 class="auto-message-title">
                <i class="fas fa-robot me-2"></i>
                自动消息设置
              </h3>
              <button class="auto-message-close" onclick="closeAutoMessageModal()">
                &times;
              </button>
            </div>
            <div class="auto-message-body" id="auto-message-settings-content">
              <!-- 自动消息设置内容将加载到这里 -->
            </div>
          </div>
        </div>
      `;
      
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      modal = document.getElementById('auto-message-modal');
      
      // 点击背景关闭
      modal.addEventListener('click', function(e) {
        if (e.target === this) {
          closeAutoMessageModal();
        }
      });
    }
    
    // 加载自动消息设置内容
    loadAutoMessageSettings();
    
    // 显示弹窗
    modal.classList.add('show');
  }

  // 关闭自动消息设置弹窗
  function closeAutoMessageModal() {
    const modal = document.getElementById('auto-message-modal');
    if (modal) {
      modal.classList.remove('show');
    }
  }

  // 加载自动消息设置内容
  async function loadAutoMessageSettings() {
    const container = document.getElementById('auto-message-settings-content');
    if (!container) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/message-templates`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const templates = await response.json();
        renderAutoMessageTemplates(templates);
      } else {
        // 如果没有模板，显示默认内容
        renderDefaultAutoMessageSettings();
      }
    } catch (error) {
      console.error('加载消息模板失败:', error);
      renderDefaultAutoMessageSettings();
    }
  }

  // 渲染自动消息模板
  function renderAutoMessageTemplates(templates) {
    const container = document.getElementById('auto-message-settings-content');
    if (!container) return;
    
    let html = '<div class="auto-message-settings">';
    
    const eventLabels = {
      'user_registered': '用户注册',
      'account_status_changed': '账户状态变更',
      'points_added': '积分增加',
      'password_changed': '密码修改',
      'welcome_message': '欢迎消息',
      'birthday_message': '生日祝福',
      'levelup_message': '等级提升'
    };
    
    templates.forEach(template => {
      html += `
        <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h4 style="margin: 0;">${eventLabels[template.event_type] || template.event_type}</h4>
            <label style="display: flex; align-items: center;">
              <input type="checkbox" ${template.is_active ? 'checked' : ''} 
                     onchange="toggleTemplate('${template.event_type}', this.checked)"
                     style="margin-right: 5px;">
              启用
            </label>
          </div>
          <div class="form-group">
            <label>标题</label>
            <input type="text" class="form-control" value="${escapeHtml(template.title)}" 
                   id="template-title-${template.event_type}">
          </div>
          <div class="form-group">
            <label>内容</label>
            <textarea class="form-control" rows="3" id="template-content-${template.event_type}">${escapeHtml(template.content)}</textarea>
            <small style="color: #6c757d;">支持变量: {username}, {nickname}, {date}</small>
          </div>
          <button class="message-btn message-btn-primary" onclick="saveTemplate('${template.event_type}')">
            <i class="fas fa-save"></i> 保存
          </button>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
  }

  // 渲染默认自动消息设置
  function renderDefaultAutoMessageSettings() {
    const container = document.getElementById('auto-message-settings-content');
    if (!container) return;
    
    container.innerHTML = `
      <div class="auto-message-settings">
        <div class="form-group">
          <label>注册欢迎消息</label>
          <textarea class="form-control" id="welcome-message" rows="3" placeholder="用户注册时自动发送的欢迎消息"></textarea>
        </div>
        <div class="form-group">
          <label>生日祝福消息</label>
          <textarea class="form-control" id="birthday-message" rows="3" placeholder="用户生日时自动发送的祝福消息"></textarea>
        </div>
        <div class="form-group">
          <label>等级提升消息</label>
          <textarea class="form-control" id="levelup-message" rows="3" placeholder="用户等级提升时自动发送的消息"></textarea>
        </div>
        <div class="form-group">
          <button class="message-btn message-btn-primary" onclick="saveAutoMessageSettings()">
            <i class="fas fa-save"></i> 保存设置
          </button>
        </div>
      </div>
    `;
  }

  // 保存自动消息设置
  async function saveAutoMessageSettings() {
    const welcomeMsg = document.getElementById('welcome-message')?.value;
    const birthdayMsg = document.getElementById('birthday-message')?.value;
    const levelupMsg = document.getElementById('levelup-message')?.value;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      // 保存各个模板
      const templates = [
        { type: 'welcome_message', content: welcomeMsg },
        { type: 'birthday_message', content: birthdayMsg },
        { type: 'levelup_message', content: levelupMsg }
      ];
      
      for (const template of templates) {
        if (template.content) {
          await fetch(`${API_BASE_URL}/api/admin/message-templates/${template.type}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              title: '系统通知',
              content: template.content,
              is_active: true
            })
          });
        }
      }
      
      showSuccessMessage('自动消息设置已保存');
    } catch (error) {
      console.error('保存自动消息设置失败:', error);
      showErrorMessage('保存失败');
    }
  }

  // 加载系统消息列表
  async function loadSystemMessages() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/system-messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const messages = await response.json();
        renderSystemMessageList(messages);
      }
    } catch (error) {
      console.error('加载系统消息失败:', error);
    }
  }

  // 渲染系统消息列表（使用简短标签）
  function renderSystemMessageList(messages) {
    const tbody = document.getElementById('system-message-list');
    if (!tbody) return;
    
    if (messages.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 40px; color: #6c757d;">
            暂无系统消息
          </td>
        </tr>
      `;
      return;
    }
    
    let html = '';
    messages.forEach(msg => {
      // 使用简短的类型标签
      const typeLabel = getMessageTypeLabelShort(msg.message_type);
      const targetLabel = msg.target_type === 'all' ? '全站用户' : `用户 ${msg.target_ids}`;
      
      html += `
        <tr>
          <td>
            <span class="message-type-badge ${msg.message_type}">${typeLabel}</span>
          </td>
          <td>${escapeHtml(msg.title)}</td>
          <td>${targetLabel}</td>
          <td>${formatTime(msg.created_at)}</td>
          <td>
            <button class="message-btn message-btn-danger" onclick="deleteSystemMessage(${msg.id})">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
    
    tbody.innerHTML = html;
  }

  // 获取消息类型短标签
  function getMessageTypeLabelShort(type) {
    const labels = {
      'user': '用户',
      'system': '系统',
      'notification': '通知',
      'auto': '自动'
    };
    return labels[type] || '未知';
  }

  // 打开系统消息发送窗口
  function openSystemMessageModal() {
    const form = document.getElementById('system-message-form');
    if (form) {
      form.style.display = 'block';
      form.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // 关闭系统消息发送窗口
  function closeSystemMessageModal() {
    const form = document.getElementById('system-message-form');
    if (form) {
      form.style.display = 'none';
      // 清空表单
      document.getElementById('system-msg-type').value = 'notification';
      document.getElementById('system-msg-target').value = 'all';
      document.getElementById('system-msg-title').value = '';
      document.getElementById('system-msg-content').value = '';
      document.getElementById('target-uid').value = '';
      document.getElementById('user-select-group').style.display = 'none';
    }
  }

  // 处理发送目标变化
  function handleTargetChange() {
    const target = document.getElementById('system-msg-target').value;
    const userGroup = document.getElementById('user-select-group');
    
    if (target === 'user') {
      userGroup.style.display = 'block';
      
      // 绑定UID搜索
      const uidInput = document.getElementById('target-uid');
      uidInput.onkeyup = function() {
        searchUserByUid(this.value);
      };
    } else {
      userGroup.style.display = 'none';
    }
  }

  // 通过UID搜索用户
  async function searchUserByUid(uid) {
    if (!uid) {
      document.getElementById('uid-search-result').innerHTML = '';
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/by-uid/${uid}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const user = await response.json();
        document.getElementById('uid-search-result').innerHTML = `
          <div style="padding: 10px; background: #f8f9fa; border-radius: 6px;">
            <div style="display: flex; align-items: center;">
              <img src="${user.avatar}" alt="" style="width: 32px; height: 32px; border-radius: 50%; margin-right: 10px;">
              <div>
                <div style="font-weight: 500;">${escapeHtml(user.nickname || user.username)}</div>
                <div style="font-size: 12px; color: #6c757d;">UID: ${user.uid}</div>
              </div>
            </div>
          </div>
        `;
      } else {
        document.getElementById('uid-search-result').innerHTML = `
          <div style="padding: 10px; color: #dc3545;">未找到用户</div>
        `;
      }
    } catch (error) {
      console.error('搜索用户失败:', error);
    }
  }

  // 发送系统消息
  async function sendSystemMessage() {
    const type = document.getElementById('system-msg-type').value;
    const target = document.getElementById('system-msg-target').value;
    const title = document.getElementById('system-msg-title').value.trim();
    const content = document.getElementById('system-msg-content').value.trim();
    
    if (!title || !content) {
      showErrorMessage('请填写完整的消息标题和内容');
      return;
    }
    
    let targetIds = null;
    if (target === 'user') {
      const uid = document.getElementById('target-uid').value.trim();
      if (!uid) {
        showErrorMessage('请输入目标用户UID');
        return;
      }
      targetIds = [uid];
    }
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/send-system-message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message_type: type,
          target_type: target,
          target_ids: targetIds,
          title: title,
          content: content
        })
      });
      
      if (response.ok) {
        showSuccessMessage('系统消息发送成功');
        closeSystemMessageModal();
        loadSystemMessages();
      } else {
        const error = await response.json();
        showErrorMessage(error.error || '发送失败');
      }
    } catch (error) {
      console.error('发送系统消息失败:', error);
      showErrorMessage('发送失败');
    }
  }

  // 删除系统消息
  async function deleteSystemMessage(messageId) {
    if (!confirm('确定要删除这条系统消息吗？')) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/system-messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        showSuccessMessage('系统消息已删除');
        loadSystemMessages();
      }
    } catch (error) {
      console.error('删除系统消息失败:', error);
      showErrorMessage('删除失败');
    }
  }

  // 切换模板启用状态
  async function toggleTemplate(eventType, isActive) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      await fetch(`${API_BASE_URL}/api/admin/message-templates/${eventType}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: isActive })
      });
    } catch (error) {
      console.error('切换模板状态失败:', error);
    }
  }

  // 保存模板
  async function saveTemplate(eventType) {
    const title = document.getElementById(`template-title-${eventType}`).value;
    const content = document.getElementById(`template-content-${eventType}`).value;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/message-templates/${eventType}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, content })
      });
      
      if (response.ok) {
        showSuccessMessage('模板已保存');
      }
    } catch (error) {
      console.error('保存模板失败:', error);
      showErrorMessage('保存失败');
    }
  }

  // 工具函数
  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
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

  function showLoginRequired(page) {
    if (typeof window.showLoginRequired === 'function') {
      window.showLoginRequired(page);
    }
  }

  // 暴露给全局
  global.renderSystemMessageAdmin = renderSystemMessageAdmin;
  global.openSystemMessageModal = openSystemMessageModal;
  global.closeSystemMessageModal = closeSystemMessageModal;
  global.handleTargetChange = handleTargetChange;
  global.searchUserByUid = searchUserByUid;
  global.sendSystemMessage = sendSystemMessage;
  global.deleteSystemMessage = deleteSystemMessage;
  global.showAutoMessageSettings = showAutoMessageSettings;
  global.closeAutoMessageModal = closeAutoMessageModal;
  global.saveAutoMessageSettings = saveAutoMessageSettings;
  global.toggleTemplate = toggleTemplate;
  global.saveTemplate = saveTemplate;

})(window);