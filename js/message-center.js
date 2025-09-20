// 简化的消息中心模块 - 调用统一的消息系统
(function(global) {
  'use strict';

  // 确保API_BASE_URL存在
  if (typeof window.API_BASE_URL === 'undefined') {
    window.API_BASE_URL = 'https://api.am-all.com.cn';
  }
  const API_BASE_URL = window.API_BASE_URL;

  // 打开消息中心
  function openMessageCenter() {
    // 关闭下拉菜单
    closeMessageDropdown();
    
    // 使用全局的loadPage函数
    if (typeof window.loadPage === 'function') {
      window.loadPage('message-center');
    } else {
      // 备用方案
      window.location.hash = '#/message-center';
      setTimeout(() => {
        renderMessageCenter();
      }, 100);
    }
  }

  // 渲染消息中心页面
  async function renderMessageCenter() {
    const container = document.getElementById('content-container');
    if (!container) {
      console.error('Content container not found');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      if (typeof showLoginRequired === 'function') {
        showLoginRequired('message-center');
      } else {
        container.innerHTML = `
          <div style="padding: 40px; text-align: center; color: #6c757d;">
            <i class="fas fa-lock" style="font-size: 48px; margin-bottom: 20px;"></i>
            <h3>请先登录查看消息</h3>
          </div>
        `;
      }
      return;
    }
    
    container.innerHTML = `
      <div class="message-center">
        <div class="message-center-header">
          <h1 class="message-center-title">消息中心</h1>
          <div class="message-actions">
            <button class="message-btn message-btn-primary" id="compose-btn">
              <i class="fas fa-paper-plane"></i> 发送消息
            </button>
            <button class="message-btn message-btn-secondary" id="select-all-btn">
              <i class="fas fa-check-square"></i> 全选
            </button>
            <button class="message-btn message-btn-danger" id="delete-selected-btn">
              <i class="fas fa-trash"></i> 删除
            </button>
          </div>
        </div>
        <div class="message-table">
          <table>
            <thead>
              <tr>
                <th width="40">
                  <input type="checkbox" id="select-all-checkbox">
                </th>
                <th width="100">类型</th>
                <th>标题</th>
                <th width="150">发送者</th>
                <th width="150">时间</th>
                <th width="100">操作</th>
              </tr>
            </thead>
            <tbody id="message-list-body">
              <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                  <i class="fas fa-spinner fa-spin"></i> 加载中...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    // 绑定事件
    bindMessageCenterEvents();
    
    // 加载消息
    await loadMessages();
  }

  // 绑定消息中心事件
  function bindMessageCenterEvents() {
    // 发送消息按钮
    const composeBtn = document.getElementById('compose-btn');
    if (composeBtn) {
      composeBtn.addEventListener('click', () => {
        // 调用统一的聊天窗口
        if (typeof window.openChatModal === 'function') {
          window.openChatModal();
        } else if (window.MessageSystem && window.MessageSystem.openChat) {
          window.MessageSystem.openChat();
        }
      });
    }
    
    // 全选按钮
    const selectAllBtn = document.getElementById('select-all-btn');
    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', selectAllMessages);
    }
    
    // 删除选中按钮
    const deleteBtn = document.getElementById('delete-selected-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', deleteSelectedMessages);
    }
    
    // 全选复选框
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', toggleSelectAll);
    }
  }

  // 加载消息列表
  async function loadMessages() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const messages = await response.json();
        renderMessageList(messages);
      } else {
        showLoadError();
      }
    } catch (error) {
      console.error('加载消息失败:', error);
      showLoadError();
    }
  }

  // 显示加载错误
  function showLoadError() {
    const tbody = document.getElementById('message-list-body');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px; color: #dc3545;">
            <i class="fas fa-exclamation-triangle" style="font-size: 32px; margin-bottom: 10px;"></i>
            <div>加载消息失败，请稍后重试</div>
          </td>
        </tr>
      `;
    }
  }

  // 渲染消息列表
  function renderMessageList(messages) {
    const tbody = document.getElementById('message-list-body');
    if (!tbody) return;
    
    if (!messages || messages.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px; color: #6c757d;">
            <i class="fas fa-inbox" style="font-size: 32px; margin-bottom: 10px;"></i>
            <div>暂无消息</div>
          </td>
        </tr>
      `;
      return;
    }
    
    let html = '';
    messages.forEach(msg => {
      const typeLabel = getMessageTypeLabel(msg.message_type);
      const isUnread = !msg.is_read;
      
      html += `
        <tr class="${isUnread ? 'unread' : ''}" data-message-id="${msg.id}">
          <td>
            <input type="checkbox" class="message-checkbox" value="${msg.id}">
          </td>
          <td>
            <span class="message-type-badge ${msg.message_type}">${typeLabel}</span>
          </td>
          <td>
            <a href="#" class="message-title-link" data-id="${msg.id}">
              ${escapeHtml(msg.title || '无标题')}
            </a>
          </td>
          <td>${escapeHtml(msg.sender_name || '系统')}</td>
          <td>${formatTime(msg.created_at)}</td>
          <td>
            <button class="message-btn message-btn-danger message-delete-btn" data-id="${msg.id}" title="删除">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
    
    tbody.innerHTML = html;
    
    // 绑定消息标题点击事件
    tbody.querySelectorAll('.message-title-link').forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const messageId = this.dataset.id;
        viewMessage(messageId);
      });
    });
    
    // 绑定删除按钮事件
    tbody.querySelectorAll('.message-delete-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const messageId = this.dataset.id;
        deleteMessage(messageId);
      });
    });
  }

  // 查看消息详情
  async function viewMessage(messageId) {
    // 调用主消息系统的openMessage函数
    if (typeof window.openMessage === 'function') {
      await window.openMessage(messageId);
      // 刷新列表以更新已读状态
      setTimeout(() => {
        loadMessages();
      }, 500);
    } else if (window.MessageSystem && window.MessageSystem.openMessage) {
      await window.MessageSystem.openMessage(messageId);
      setTimeout(() => {
        loadMessages();
      }, 500);
    } else {
      console.error('openMessage function not found');
    }
  }

  // 删除消息
  async function deleteMessage(messageId) {
    if (!confirm('确定要删除这条消息吗？')) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        showSuccessToast('消息已删除');
        await loadMessages();
        // 更新未读计数
        if (typeof window.checkUnreadMessages === 'function') {
          window.checkUnreadMessages();
        } else if (window.MessageSystem && window.MessageSystem.checkUnread) {
          window.MessageSystem.checkUnread();
        }
      } else {
        showErrorToast('删除失败');
      }
    } catch (error) {
      console.error('删除消息失败:', error);
      showErrorToast('删除失败');
    }
  }

  // 批量删除选中的消息
  async function deleteSelectedMessages() {
    const checkboxes = document.querySelectorAll('.message-checkbox:checked');
    if (checkboxes.length === 0) {
      showErrorToast('请选择要删除的消息');
      return;
    }
    
    if (!confirm(`确定要删除选中的 ${checkboxes.length} 条消息吗？`)) return;
    
    const messageIds = Array.from(checkboxes).map(cb => cb.value);
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/batch-delete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message_ids: messageIds })
      });
      
      if (response.ok) {
        showSuccessToast('消息已删除');
        await loadMessages();
        // 更新未读计数
        if (typeof window.checkUnreadMessages === 'function') {
          window.checkUnreadMessages();
        } else if (window.MessageSystem && window.MessageSystem.checkUnread) {
          window.MessageSystem.checkUnread();
        }
      } else {
        showErrorToast('删除失败');
      }
    } catch (error) {
      console.error('批量删除失败:', error);
      showErrorToast('删除失败');
    }
  }

  // 全选/取消全选
  function toggleSelectAll() {
    const selectAll = document.getElementById('select-all-checkbox');
    const checkboxes = document.querySelectorAll('.message-checkbox');
    checkboxes.forEach(cb => cb.checked = selectAll.checked);
  }

  // 选择所有消息
  function selectAllMessages() {
    const checkboxes = document.querySelectorAll('.message-checkbox');
    checkboxes.forEach(cb => cb.checked = true);
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    if (selectAllCheckbox) {
      selectAllCheckbox.checked = true;
    }
  }

  // 关闭消息下拉菜单（辅助函数）
  function closeMessageDropdown() {
    const dropdowns = document.querySelectorAll('.message-dropdown, .message-dropdown-mobile');
    dropdowns.forEach(dropdown => {
      dropdown.classList.remove('show');
    });
  }

  // 工具函数
  function getMessageTypeLabel(type) {
    const labels = {
      'user': '用户消息',
      'system': '系统消息',
      'notification': '通知',
      'auto': '自动消息'
    };
    return labels[type] || '未知';
  }

  function formatTime(timestamp) {
    if (!timestamp) return '未知时间';
    
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

  // Toast 提示函数
  function showSuccessToast(message) {
    if (typeof window.showSuccessMessage === 'function') {
      window.showSuccessMessage(message);
    } else {
      showToast(message, 'success');
    }
  }

  function showErrorToast(message) {
    if (typeof window.showErrorMessage === 'function') {
      window.showErrorMessage(message);
    } else {
      showToast(message, 'error');
    }
  }

  // 简单的Toast实现
  function showToast(message, type = 'info') {
    const existingToast = document.querySelector('.message-toast');
    if (existingToast) {
      existingToast.remove();
    }
    
    const toastHTML = `
      <div class="message-toast ${type}" style="
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideInRight 0.3s;
        max-width: 300px;
      ">
        ${message}
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', toastHTML);
    const toast = document.querySelector('.message-toast:last-child');
    
    setTimeout(() => {
      if (toast) {
        toast.style.animation = 'slideOutRight 0.3s';
        setTimeout(() => {
          if (toast) toast.remove();
        }, 300);
      }
    }, 3000);
  }

  // 暴露给全局 - 使用命名空间避免冲突
  global.MessageCenter = {
    openMessageCenter,
    renderMessageCenter,
    loadMessages,
    viewMessage,
    deleteMessage,
    deleteSelectedMessages,
    toggleSelectAll,
    selectAllMessages
  };

  // 为了兼容性，也暴露主要函数到全局
  global.openMessageCenter = openMessageCenter;
  global.renderMessageCenter = renderMessageCenter;

})(window);