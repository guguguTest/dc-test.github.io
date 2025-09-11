// toolsManage.js - 实用工具管理模块

(function(global) {
  'use strict';

  let currentEditingTool = null;

  // 初始化工具管理页面
  async function initToolsAdmin() {
    const container = document.getElementById('content-container');
    if (!container) return;

    container.innerHTML = `
      <div class="section">
        <div class="tools-admin-container">
          <div class="tools-admin-header">
            <h1 class="page-title">实用工具管理</h1>
            <div class="tools-admin-actions">
              <button class="btn-add-tool" onclick="showAddToolModal()">
                <i class="fas fa-plus me-2"></i>添加工具
              </button>
              <button class="back-button" data-page="site-admin">
                <i class="fas fa-arrow-left me-2"></i>返回网站管理
              </button>
            </div>
          </div>
          
          <div class="tools-admin-table">
            <table>
              <thead>
                <tr>
                  <th>排序</th>
                  <th>标题</th>
                  <th>类型</th>
                  <th>权限要求</th>
                  <th>积分</th>
                  <th>状态</th>
                  <th>更新时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody id="tools-list-body">
                <tr><td colspan="8" style="text-align:center;padding:40px;">加载中...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // 创建模态框
    createToolModal();
    
    // 加载工具列表
    await loadToolsList();
  }

  // 创建工具编辑模态框
  function createToolModal() {
    if (document.getElementById('tool-edit-modal')) return;

    const modalHtml = `
      <div id="tool-edit-modal" class="tool-modal">
        <div class="tool-modal-content">
          <div class="tool-modal-header">
            <h3 class="tool-modal-title" id="tool-modal-title">添加工具</h3>
            <button class="tool-modal-close" onclick="closeToolModal()">&times;</button>
          </div>
          <div class="tool-modal-body">
            <form id="tool-form">
              <input type="hidden" id="tool-id">
              
              <div class="tool-form-group">
                <label for="tool-title">工具标题 *</label>
                <input type="text" id="tool-title" required>
              </div>
              
              <div class="tool-form-group">
                <label for="tool-description">工具介绍</label>
                <textarea id="tool-description"></textarea>
              </div>
              
              <div class="tool-form-group">
                <label for="tool-type">工具类型 *</label>
                <select id="tool-type" required onchange="onToolTypeChange()">
                  <option value="link">直接下载链接</option>
                  <option value="page">网站内部页面</option>
                </select>
              </div>
              
              <div class="tool-form-group">
                <label for="tool-target">
                  <span id="target-label">下载链接</span> *
                </label>
                <input type="text" id="tool-target" required placeholder="https://example.com/file.zip">
              </div>
              
              <div class="tool-form-group" id="file-size-group">
                <label for="tool-file-size">文件大小</label>
                <input type="text" id="tool-file-size" placeholder="例如: 10.5MB">
              </div>
              
              <div class="tool-form-group">
                <label for="tool-icon">图标类名</label>
                <input type="text" id="tool-icon" placeholder="fas fa-tools" value="fas fa-tools">
              </div>
              
              <div class="tool-form-group">
                <label for="tool-access-level">最低用户组权限</label>
                <select id="tool-access-level">
                  <option value="0">普通用户</option>
                  <option value="1">初级用户</option>
                  <option value="2">中级用户</option>
                  <option value="3">高级用户</option>
                  <option value="4">贵宾用户</option>
                  <option value="5">管理员</option>
                </select>
              </div>
              
              <div class="tool-form-group">
                <label for="tool-special-group">特殊用户组要求</label>
                <select id="tool-special-group">
                  <option value="">无</option>
                  <option value="1">特殊组1</option>
                  <option value="2">协同管理员</option>
                </select>
              </div>
              
              <div class="tool-form-group">
                <label for="tool-points">使用所需积分</label>
                <input type="number" id="tool-points" min="0" value="0">
              </div>
              
              <div class="tool-form-group">
                <label for="tool-sort">排序值</label>
                <input type="number" id="tool-sort" min="0" value="0">
              </div>
              
              <div class="tool-form-group">
                <label>
                  <input type="checkbox" id="tool-active" checked> 启用
                </label>
              </div>
            </form>
          </div>
          <div class="tool-modal-footer">
            <button class="btn-modal-cancel" onclick="closeToolModal()">取消</button>
            <button class="btn-modal-save" onclick="saveToolData()">保存</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  // 加载工具列表
  async function loadToolsList() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://api.am-all.com.cn/api/admin/tools', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('加载失败');
      
      const tools = await response.json();
      renderToolsList(tools);
    } catch (error) {
      console.error('加载工具列表失败:', error);
      document.getElementById('tools-list-body').innerHTML = 
        '<tr><td colspan="8" style="text-align:center;color:red;">加载失败</td></tr>';
    }
  }

  // 渲染工具列表
  function renderToolsList(tools) {
    const tbody = document.getElementById('tools-list-body');
    if (!tools || tools.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">暂无工具</td></tr>';
      return;
    }

    tbody.innerHTML = tools.map(tool => `
      <tr>
        <td>${tool.sort_order || 0}</td>
        <td>${tool.title}</td>
        <td>${tool.tool_type === 'page' ? '内部页面' : '下载链接'}</td>
        <td>
          ${tool.access_level > 0 ? `Lv.${tool.access_level}` : '无'}
          ${tool.special_group ? ` + 特殊组${tool.special_group}` : ''}
        </td>
        <td>${tool.required_points || 0} 积分</td>
        <td>${tool.is_active ? '<span style="color:green;">启用</span>' : '<span style="color:red;">停用</span>'}</td>
        <td>${new Date(tool.last_update).toLocaleDateString()}</td>
        <td class="tool-admin-actions">
          <button class="btn-tool-edit" onclick="editTool(${tool.id})">编辑</button>
          <button class="btn-tool-delete" onclick="deleteTool(${tool.id})">删除</button>
        </td>
      </tr>
    `).join('');
  }

  // 显示添加工具模态框
  window.showAddToolModal = function() {
    currentEditingTool = null;
    document.getElementById('tool-modal-title').textContent = '添加工具';
    document.getElementById('tool-form').reset();
    document.getElementById('tool-id').value = '';
    document.getElementById('tool-active').checked = true;
    document.getElementById('tool-edit-modal').classList.add('show');
  };

  // 编辑工具
  window.editTool = async function(toolId) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://api.am-all.com.cn/api/admin/tools/${toolId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('加载失败');
      
      const tool = await response.json();
      currentEditingTool = tool;
      
      document.getElementById('tool-modal-title').textContent = '编辑工具';
      document.getElementById('tool-id').value = tool.id;
      document.getElementById('tool-title').value = tool.title;
      document.getElementById('tool-description').value = tool.description || '';
      document.getElementById('tool-type').value = tool.tool_type;
      document.getElementById('tool-target').value = tool.target_url;
      document.getElementById('tool-file-size').value = tool.file_size || '';
      document.getElementById('tool-icon').value = tool.icon_class || 'fas fa-tools';
      document.getElementById('tool-access-level').value = tool.access_level || 0;
      document.getElementById('tool-special-group').value = tool.special_group || '';
      document.getElementById('tool-points').value = tool.required_points || 0;
      document.getElementById('tool-sort').value = tool.sort_order || 0;
      document.getElementById('tool-active').checked = tool.is_active;
      
      onToolTypeChange(); // 更新表单显示
      document.getElementById('tool-edit-modal').classList.add('show');
    } catch (error) {
      console.error('加载工具信息失败:', error);
      alert('加载工具信息失败');
    }
  };

  // 删除工具
  window.deleteTool = async function(toolId) {
    if (!confirm('确定要删除这个工具吗？')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://api.am-all.com.cn/api/admin/tools/${toolId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('删除失败');
      
      await loadToolsList();
      if (typeof showSuccessMessage === 'function') {
        showSuccessMessage('删除成功');
      }
    } catch (error) {
      console.error('删除工具失败:', error);
      alert('删除失败');
    }
  };

  // 关闭模态框
  window.closeToolModal = function() {
    document.getElementById('tool-edit-modal').classList.remove('show');
  };

  // 工具类型改变
  window.onToolTypeChange = function() {
    const type = document.getElementById('tool-type').value;
    const targetLabel = document.getElementById('target-label');
    const targetInput = document.getElementById('tool-target');
    const fileSizeGroup = document.getElementById('file-size-group');
    
    if (type === 'page') {
      targetLabel.textContent = '页面路径';
      targetInput.placeholder = '例如: icfeditor.html';
      fileSizeGroup.style.display = 'none';
    } else {
      targetLabel.textContent = '下载链接';
      targetInput.placeholder = 'https://example.com/file.zip';
      fileSizeGroup.style.display = 'block';
    }
  };

  // 保存工具数据
  window.saveToolData = async function() {
    const form = document.getElementById('tool-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const toolId = document.getElementById('tool-id').value;
    const toolData = {
      title: document.getElementById('tool-title').value,
      description: document.getElementById('tool-description').value,
      tool_type: document.getElementById('tool-type').value,
      target_url: document.getElementById('tool-target').value,
      file_size: document.getElementById('tool-file-size').value || null,
      icon_class: document.getElementById('tool-icon').value || 'fas fa-tools',
      access_level: parseInt(document.getElementById('tool-access-level').value),
      special_group: document.getElementById('tool-special-group').value || null,
      required_points: parseInt(document.getElementById('tool-points').value) || 0,
      sort_order: parseInt(document.getElementById('tool-sort').value) || 0,
      is_active: document.getElementById('tool-active').checked
    };

    try {
      const token = localStorage.getItem('token');
      const url = toolId 
        ? `https://api.am-all.com.cn/api/admin/tools/${toolId}`
        : 'https://api.am-all.com.cn/api/admin/tools';
      
      const response = await fetch(url, {
        method: toolId ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(toolData)
      });

      if (!response.ok) throw new Error('保存失败');
      
      closeToolModal();
      await loadToolsList();
      
      if (typeof showSuccessMessage === 'function') {
        showSuccessMessage(toolId ? '更新成功' : '添加成功');
      }
    } catch (error) {
      console.error('保存工具失败:', error);
      alert('保存失败');
    }
  };

  // 导出初始化函数
  global.initToolsAdmin = initToolsAdmin;

})(window);