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
          <div class="message-center-header">
            <h1 class="message-center-title">实用工具管理</h1>
            <div class="message-actions">
              <button class="message-btn message-btn-primary" onclick="toolsAdminShowAddToolModal()">
                <i class="fas fa-plus"></i> 添加工具
              </button>
              <button class="message-btn message-btn-ghost" data-page="site-admin">
                <i class="fas fa-arrow-left"></i> 返回管理
              </button>
            </div>
          </div>
          
          <div class="tools-admin-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>标题</th>
                  <th class="desktop-only">描述</th>
                  <th class="desktop-only">类型</th>
                  <th class="desktop-only">权限</th>
                  <th class="desktop-only">积分</th>
                  <th>状态</th>
                  <th class="desktop-only">更新时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody id="tools-list-body">
                <tr><td colspan="9" style="text-align:center;padding:40px;">加载中...</td></tr>
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

  function createToolModal() {
    if (document.getElementById('tool-edit-modal')) return;

    const modalHtml = `
      <div id="tool-edit-modal" class="tool-modal">
        <div class="tool-modal-content">
          <div class="tool-modal-header">
            <h3 class="tool-modal-title" id="tool-modal-title">添加工具</h3>
            <button class="tool-modal-close" onclick="toolsAdminCloseToolModal()">&times;</button>
          </div>
          <div class="tool-modal-body">
            <form id="tool-form">
              <input type="hidden" id="tool-id">
              
              <div class="tool-form-group">
                <label for="tool-title">工具标题 *</label>
                <input type="text" id="tool-title" required maxlength="255" placeholder="例如：ICF Editor">
              </div>
              
              <div class="tool-form-group">
                <label for="tool-description">工具介绍</label>
                <textarea id="tool-description" rows="3" maxlength="2000" placeholder="简要描述工具用途和注意事项"></textarea>
              </div>
              
              <div class="tool-form-row">
                <div class="tool-form-group">
                  <label for="tool-type">工具类型 *</label>
                  <select id="tool-type" required onchange="onToolTypeChange()">
                    <option value="page">内部页面</option>
                    <option value="link">下载链接</option>
                  </select>
                </div>
                
                <div class="tool-form-group">
                  <label for="tool-sort">排序值</label>
                  <input type="number" id="tool-sort" value="0">
                </div>
              </div>
              
              <div class="tool-form-group">
                <label for="tool-target" id="target-label">页面路径</label>
                <input type="text" id="tool-target" required placeholder="例如: icfeditor.html">
              </div>
              
              <div class="tool-form-group" id="file-size-group" style="display:none;">
                <label for="tool-file-size">文件大小</label>
                <input type="text" id="tool-file-size" placeholder="例如：1.2 GB">
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
                  <option value="1">maimoller</option>
                  <option value="2">协同管理员</option>
                </select>
              </div>
              
              <div class="tool-form-group">
                <label for="tool-points">使用所需积分</label>
                <input type="number" id="tool-points" min="0" value="0">
              </div>
              
              <div class="tool-form-group tool-form-switch">
                <label for="tool-active">启用状态</label>
                <label class="switch">
                  <input type="checkbox" id="tool-active" checked>
                  <span class="slider round"></span>
                </label>
              </div>
            </form>
          </div>
          <div class="tool-modal-footer">
            <button class="btn-modal-cancel" onclick="toolsAdminCloseToolModal()">取消</button>
            <button class="btn-modal-save" onclick="toolsAdminSaveToolData()">保存</button>
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
        '<tr><td colspan="9" style="text-align:center;color:red;">加载失败</td></tr>';
    }
  }

  // 渲染工具列表
  function renderToolsList(tools) {
    const tbody = document.getElementById('tools-list-body');
    if (!tbody) return;

    if (!tools || tools.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;">暂无工具</td></tr>';
      return;
    }

    tbody.innerHTML = tools.map(tool => {
      const specialGroupText = (() => {
        if (!tool.special_group) return '';
        if (tool.special_group === '1') return 'maimoller';
        if (tool.special_group === '2') return '协同管理员';
        return tool.special_group;
      })();

      return `
      <tr>
        <td data-label="ID">${tool.id}</td>
        <td data-label="标题">
          <div class="tool-title-cell">
            <div class="tool-icon">
              <i class="${tool.icon_class || 'fas fa-tools'}"></i>
            </div>
            <div class="tool-title-wrapper">
              <div class="tool-title">${tool.title}</div>
              <div class="tool-target mobile-only">${tool.target_url}</div>
              ${tool.file_size ? `<div class="tool-file-size mobile-only">大小: ${tool.file_size}</div>` : ''}
            </div>
          </div>
        </td>
        <td data-label="介绍" class="tool-description-cell">
          <div class="tool-description">${tool.description || '无描述'}</div>
        </td>
        <td data-label="类型" class="desktop-only">${tool.tool_type === 'page' ? '内部页面' : '下载链接'}</td>
        <td data-label="权限" class="desktop-only">
          ${tool.access_level > 0 ? `Lv.${tool.access_level}` : '无'}
          ${specialGroupText ? ` + ${specialGroupText}` : ''}
        </td>
        <td data-label="积分" class="desktop-only">${tool.required_points || 0} 积分</td>
        <td data-label="状态">${tool.is_active ? '<span class="status-active">启用</span>' : '<span class="status-inactive">停用</span>'}</td>
        <td data-label="更新时间" class="desktop-only">${new Date(tool.last_update).toLocaleDateString()}</td>
        <td data-label="操作" class="tool-admin-actions">
          <button class="btn-tool-edit" onclick="toolsAdminEditTool(${tool.id})" title="编辑">
            <i class="fas fa-edit"></i>
            <span class="mobile-text">编辑</span>
          </button>
          <button class="btn-tool-delete" onclick="toolsAdminDeleteTool(${tool.id})" title="删除">
            <i class="fas fa-trash-alt"></i>
            <span class="mobile-text">删除</span>
          </button>
        </td>
      </tr>
      `;
    }).join('');
  }

  // 显示添加工具模态框
  window.toolsAdminShowAddToolModal = function() {
    currentEditingTool = null;
    document.getElementById('tool-modal-title').textContent = '添加工具';
    document.getElementById('tool-form').reset();
    document.getElementById('tool-id').value = '';
    document.getElementById('tool-active').checked = true;
    document.getElementById('tool-edit-modal').classList.add('show');
  };

  // 编辑工具
  window.toolsAdminEditTool = async function(toolId) {
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
  window.toolsAdminDeleteTool = async function(toolId) {
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
  window.toolsAdminCloseToolModal = function() {
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
  window.toolsAdminSaveToolData = async function() {
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
      
      toolsAdminCloseToolModal();
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
