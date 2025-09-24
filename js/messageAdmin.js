// 系统消息管理 - 改进版
(function(global) {
  'use strict';

  // 确保API_BASE_URL存在
  if (typeof window.API_BASE_URL === 'undefined') {
    window.API_BASE_URL = 'https://api.am-all.com.cn';
  }
  const API_BASE_URL = window.API_BASE_URL;

  // 存储选中的消息ID
  let selectedMessageIds = new Set();

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
            <button class="message-btn message-btn-ghost" data-page="site-admin">
              <i class="fas fa-arrow-left"></i> 返回管理
            </button>
          </div>
        </div>
        
        <h3 class="system-message-list-title">
          已发送的系统消息
        </h3>
        
        <div class="message-table-toolbar">
          <div class="toolbar-left">
            <button class="message-btn message-btn-ghost" onclick="selectAllMessages()">
              <i class="fas fa-check-square"></i> 全选
            </button>
            <button class="message-btn message-btn-ghost" onclick="deselectAllMessages()">
              <i class="fas fa-square"></i> 取消全选
            </button>
            <button class="message-btn message-btn-danger" onclick="deleteSelectedMessages()" id="delete-selected-btn" disabled>
              <i class="fas fa-trash"></i> 删除选中
            </button>
          </div>
          <div class="toolbar-right">
            <span class="selected-count" id="selected-count">已选择: 0</span>
          </div>
        </div>
        
        <div class="message-table-container">
          <div class="message-table-scroll">
            <table class="message-table">
              <thead>
                <tr>
                  <th width="40">
                    <input type="checkbox" id="select-all-checkbox" onchange="handleSelectAllChange()">
                  </th>
                  <th width="100">类型</th>
                  <th>标题</th>
                  <th width="150">目标</th>
                  <th width="150">发送时间</th>
                  <th width="100">操作</th>
                </tr>
              </thead>
              <tbody id="system-message-list">
                <tr>
                  <td colspan="6" style="text-align: center; padding: 40px;">
                    <i class="fas fa-spinner fa-spin"></i> 加载中...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    
    // 关闭任何可能存在的旧弹窗
    closeSystemMessageModal();
    closeAutoMessageModal();
    
    loadSystemMessages();
  }

  // 打开系统消息发送弹窗
  function openSystemMessageModal() {
    // 检查是否已存在弹窗
    let modal = document.getElementById('system-message-modal');
    
    if (!modal) {
      // 创建弹窗HTML
      const modalHTML = `
        <div id="system-message-modal" class="message-modal">
          <div class="message-modal-container">
            <div class="message-modal-header">
              <h3 class="message-modal-title">
                <i class="fas fa-paper-plane me-2"></i>
                发送系统消息
              </h3>
              <button class="message-modal-close" onclick="closeSystemMessageModal()">
                &times;
              </button>
            </div>
            <div class="message-modal-body">
              <form id="system-message-form">
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
                  <textarea class="form-control textarea" id="system-msg-content" rows="5" placeholder="请输入消息内容"></textarea>
                </div>
              </form>
            </div>
            <div class="message-modal-footer">
              <button class="message-btn message-btn-primary" onclick="sendSystemMessage()">
                <i class="fas fa-paper-plane"></i> 发送
              </button>
              <button class="message-btn message-btn-ghost" onclick="closeSystemMessageModal()">
                取消
              </button>
            </div>
          </div>
        </div>
      `;
      
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      modal = document.getElementById('system-message-modal');
      
      // 点击背景关闭
      modal.addEventListener('click', function(e) {
        if (e.target === this) {
          closeSystemMessageModal();
        }
      });
    }
    
    // 重置表单
    document.getElementById('system-msg-type').value = 'notification';
    document.getElementById('system-msg-target').value = 'all';
    document.getElementById('system-msg-title').value = '';
    document.getElementById('system-msg-content').value = '';
    document.getElementById('target-uid').value = '';
    document.getElementById('user-select-group').style.display = 'none';
    
    // 显示弹窗
    modal.classList.add('show');
  }

  // 关闭系统消息发送弹窗
  function closeSystemMessageModal() {
    const modal = document.getElementById('system-message-modal');
    if (modal) {
      modal.classList.remove('show');
      // 延迟移除DOM元素
      setTimeout(() => {
        if (modal && !modal.classList.contains('show')) {
          modal.remove();
        }
      }, 300);
    }
  }

  // 显示自动消息设置弹窗
  function showAutoMessageSettings() {
    // 检查是否已存在弹窗
    let modal = document.getElementById('auto-message-modal');
    
    if (!modal) {
      // 创建弹窗HTML
      const modalHTML = `
        <div id="auto-message-modal" class="message-modal">
          <div class="message-modal-container">
            <div class="message-modal-header">
              <h3 class="message-modal-title">
                <i class="fas fa-robot me-2"></i>
                自动消息设置
              </h3>
              <button class="message-modal-close" onclick="closeAutoMessageModal()">
                &times;
              </button>
            </div>
            <div class="message-modal-body" id="auto-message-settings-content">
              <!-- 自动消息设置内容将加载到这里 -->
            </div>
            <div class="message-modal-footer">
              <button class="message-btn message-btn-primary" onclick="saveAllAutoMessageSettings()">
                <i class="fas fa-save"></i> 保存设置
              </button>
              <button class="message-btn message-btn-ghost" onclick="closeAutoMessageModal()">
                取消
              </button>
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
      // 延迟移除DOM元素
      setTimeout(() => {
        if (modal && !modal.classList.contains('show')) {
          modal.remove();
        }
      }, 300);
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
        <div class="template-item">
          <div class="template-header">
            <h4>${eventLabels[template.event_type] || template.event_type}</h4>
            <label class="template-toggle">
              <input type="checkbox" ${template.is_active ? 'checked' : ''} 
                     data-event-type="${template.event_type}">
              <span>启用</span>
            </label>
          </div>
          <div class="form-group">
            <label>标题</label>
            <input type="text" class="form-control" value="${escapeHtml(template.title)}" 
                   data-field="title" data-event-type="${template.event_type}">
          </div>
          <div class="form-group">
            <label>内容</label>
            <textarea class="form-control" rows="3" 
                      data-field="content" data-event-type="${template.event_type}">${escapeHtml(template.content)}</textarea>
            <small class="form-hint">支持变量: {username}, {nickname}, {date}</small>
          </div>
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
        <div class="template-item">
          <h4>注册欢迎消息</h4>
          <div class="form-group">
            <textarea class="form-control" data-template-type="welcome" rows="3" 
                      placeholder="用户注册时自动发送的欢迎消息"></textarea>
          </div>
        </div>
        <div class="template-item">
          <h4>生日祝福消息</h4>
          <div class="form-group">
            <textarea class="form-control" data-template-type="birthday" rows="3" 
                      placeholder="用户生日时自动发送的祝福消息"></textarea>
          </div>
        </div>
        <div class="template-item">
          <h4>等级提升消息</h4>
          <div class="form-group">
            <textarea class="form-control" data-template-type="levelup" rows="3" 
                      placeholder="用户等级提升时自动发送的消息"></textarea>
          </div>
        </div>
      </div>
    `;
  }

  // 保存所有自动消息设置
  async function saveAllAutoMessageSettings() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const container = document.getElementById('auto-message-settings-content');
    if (!container) return;
    
    try {
      const templates = [];
      
      // 收集所有模板数据
      container.querySelectorAll('.template-item').forEach(item => {
        const checkbox = item.querySelector('input[type="checkbox"][data-event-type]');
        const titleInput = item.querySelector('input[data-field="title"]');
        const contentInput = item.querySelector('textarea[data-field="content"]');
        
        if (checkbox && titleInput && contentInput) {
          const eventType = checkbox.dataset.eventType;
          templates.push({
            event_type: eventType,
            title: titleInput.value,
            content: contentInput.value,
            is_active: checkbox.checked
          });
        } else {
          // 处理默认模板格式
          const textarea = item.querySelector('textarea[data-template-type]');
          if (textarea && textarea.value) {
            const type = textarea.dataset.templateType + '_message';
            templates.push({
              event_type: type,
              title: '系统通知',
              content: textarea.value,
              is_active: true
            });
          }
        }
      });
      
      // 批量保存模板
      for (const template of templates) {
        await fetch(`${API_BASE_URL}/api/admin/message-templates/${template.event_type}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(template)
        });
      }
      
      showSuccessMessage('自动消息设置已保存');
      closeAutoMessageModal();
    } catch (error) {
      console.error('保存自动消息设置失败:', error);
      showErrorMessage('保存失败');
    }
  }

  // 处理目标选择变化
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
          <div class="uid-search-result-box">
            <img src="${user.avatar}" alt="">
            <div>
              <div class="uid-result-name">${escapeHtml(user.nickname || user.username)}</div>
              <div class="uid-result-uid">UID: ${user.uid}</div>
            </div>
          </div>
        `;
      } else {
        document.getElementById('uid-search-result').innerHTML = `
          <div class="uid-search-error">未找到用户</div>
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

  // 渲染系统消息列表
  function renderSystemMessageList(messages) {
    const tbody = document.getElementById('system-message-list');
    if (!tbody) return;
    
    // 重置选中状态
    selectedMessageIds.clear();
    updateSelectionUI();
    
    if (messages.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px; color: #6c757d;">
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
        <tr data-message-id="${msg.id}">
          <td>
            <input type="checkbox" class="message-checkbox" value="${msg.id}" onchange="handleMessageCheckbox(${msg.id})">
          </td>
          <td>
            <span class="message-type-badge ${msg.message_type}">${typeLabel}</span>
          </td>
          <td class="message-title">${escapeHtml(msg.title)}</td>
          <td class="message-target">${targetLabel}</td>
          <td class="message-time">${formatTime(msg.created_at)}</td>
          <td>
            <button class="message-btn message-btn-danger message-btn-sm" onclick="deleteSystemMessage(${msg.id})">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
    
    tbody.innerHTML = html;
  }

  // 处理消息复选框
  function handleMessageCheckbox(messageId) {
    if (selectedMessageIds.has(messageId)) {
      selectedMessageIds.delete(messageId);
    } else {
      selectedMessageIds.add(messageId);
    }
    updateSelectionUI();
  }

  // 处理全选复选框
  function handleSelectAllChange() {
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    const checkboxes = document.querySelectorAll('.message-checkbox');
    
    if (selectAllCheckbox.checked) {
      checkboxes.forEach(checkbox => {
        checkbox.checked = true;
        selectedMessageIds.add(parseInt(checkbox.value));
      });
    } else {
      checkboxes.forEach(checkbox => {
        checkbox.checked = false;
      });
      selectedMessageIds.clear();
    }
    
    updateSelectionUI();
  }

  // 全选消息
  function selectAllMessages() {
    const checkboxes = document.querySelectorAll('.message-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.checked = true;
      selectedMessageIds.add(parseInt(checkbox.value));
    });
    document.getElementById('select-all-checkbox').checked = true;
    updateSelectionUI();
  }

  // 取消全选
  function deselectAllMessages() {
    const checkboxes = document.querySelectorAll('.message-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
    selectedMessageIds.clear();
    document.getElementById('select-all-checkbox').checked = false;
    updateSelectionUI();
  }

  // 删除选中的消息
  async function deleteSelectedMessages() {
    if (selectedMessageIds.size === 0) return;
    
    if (!confirm(`确定要删除选中的 ${selectedMessageIds.size} 条消息吗？`)) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const deletePromises = Array.from(selectedMessageIds).map(messageId =>
        fetch(`${API_BASE_URL}/api/admin/system-messages/${messageId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      );
      
      await Promise.all(deletePromises);
      
      showSuccessMessage(`已删除 ${selectedMessageIds.size} 条消息`);
      loadSystemMessages();
    } catch (error) {
      console.error('删除消息失败:', error);
      showErrorMessage('删除失败');
    }
  }

  // 更新选中状态UI
  function updateSelectionUI() {
    const count = selectedMessageIds.size;
    const selectedCountElement = document.getElementById('selected-count');
    const deleteButton = document.getElementById('delete-selected-btn');
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    const totalCheckboxes = document.querySelectorAll('.message-checkbox').length;
    
    if (selectedCountElement) {
      selectedCountElement.textContent = `已选择: ${count}`;
    }
    
    if (deleteButton) {
      deleteButton.disabled = count === 0;
    }
    
    if (selectAllCheckbox) {
      if (count === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
      } else if (count === totalCheckboxes && totalCheckboxes > 0) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
      } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
      }
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
  global.saveAllAutoMessageSettings = saveAllAutoMessageSettings;
  global.selectAllMessages = selectAllMessages;
  global.deselectAllMessages = deselectAllMessages;
  global.deleteSelectedMessages = deleteSelectedMessages;
  global.handleMessageCheckbox = handleMessageCheckbox;
  global.handleSelectAllChange = handleSelectAllChange;

})(window);