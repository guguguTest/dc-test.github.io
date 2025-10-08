// 补丁工具管理模块
(function() {
  'use strict';
  
  const API_BASE = 'https://api.am-all.com.cn';
  let allTools = [];
  let selectedToolIds = new Set();
  
// 辅助函数：获取完整的图片URL
function getFullImageUrl(path) {
  if (!path) {
    console.log('路径为空，使用默认图片');
    return 'https://oss.am-all.com.cn/asset/img/main/default-tool.png';
  }
  
  // 如果已经是完整URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // 如果是相对路径，拼接API_BASE
  // 确保不会出现双斜杠
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  const fullUrl = API_BASE + cleanPath;
  
  console.log('图片路径转换:', path, '->', fullUrl);
  return fullUrl;
}
  
  // 渲染管理页面
  window.renderPatcherAdmin = async function() {
    const container = document.getElementById('content-container');
    if (!container) return;
    
    container.innerHTML = `
      <div class="patcher-admin-page">
        <div class="admin-header">
          <h1 class="page-title">
            <i class="fas fa-tools me-2"></i>
            补丁工具管理
          </h1>
          <div class="admin-actions">
            <button class="btn btn-success" id="create-tool-btn">
              <i class="fas fa-plus me-2"></i>
              新建工具
            </button>
            <button class="btn btn-secondary" id="select-all-btn">
              <i class="fas fa-check-square me-2"></i>
              全选
            </button>
            <button class="btn btn-secondary" id="deselect-all-btn">
              <i class="fas fa-square me-2"></i>
              取消全选
            </button>
            <button class="btn btn-danger" id="batch-delete-btn" disabled>
              <i class="fas fa-trash me-2"></i>
              删除选中
            </button>
          </div>
        </div>
        
        <div class="admin-content">
          <div class="loading-state">
            <div class="spinner-border text-primary"></div>
            <p>加载中...</p>
          </div>
          <div class="tools-table-container" style="display: none;">
            <table class="tools-table">
              <thead>
                <tr>
                  <th width="50"><input type="checkbox" id="select-all-checkbox"></th>
                  <th width="80">ID</th>
                  <th width="120">封面</th>
                  <th>工具名称</th>
                  <th width="120">分类</th>
                  <th width="100">状态</th>
                  <th width="100">一级权限</th>
                  <th width="120">二级权限</th>
                  <th width="80">排序</th>
                  <th width="150">操作</th>
                </tr>
              </thead>
              <tbody id="tools-table-body"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    
    // 绑定事件
    document.getElementById('create-tool-btn').addEventListener('click', showCreateToolModal);
    document.getElementById('select-all-btn').addEventListener('click', selectAllTools);
    document.getElementById('deselect-all-btn').addEventListener('click', deselectAllTools);
    document.getElementById('batch-delete-btn').addEventListener('click', batchDeleteTools);
    document.getElementById('select-all-checkbox').addEventListener('change', toggleSelectAll);
    
    // 加载工具列表
    await loadTools();
  };
  
  async function loadTools() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/admin/patcher-tools`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('加载工具列表失败');
      }
      
      const data = await response.json();
      
      if (data.success && data.tools) {
        allTools = data.tools;
        renderToolsTable(allTools);
      } else {
        throw new Error('加载工具列表失败');
      }
    } catch (error) {
      console.error('加载工具列表失败:', error);
      showError('加载工具列表失败: ' + error.message);
    }
  }
  
  function renderToolsTable(tools) {
    const tbody = document.getElementById('tools-table-body');
    const loadingState = document.querySelector('.loading-state');
    const tableContainer = document.querySelector('.tools-table-container');
    
    if (!tbody) return;
    
    if (tools.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" class="text-center py-5">
            <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
            <p class="text-muted">暂无工具数据</p>
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = tools.map(tool => {
        // 获取封面图片URL，如果没有则使用默认图片
        const coverUrl = tool.cover_image 
          ? getFullImageUrl(tool.cover_image) 
          : 'https://oss.am-all.com.cn/asset/img/main/default-tool.png';
        
        return `
          <tr data-tool-id="${tool.id}">
            <td>
              <input type="checkbox" class="tool-checkbox" data-id="${tool.id}">
            </td>
            <td>${tool.sort_order}</td>
            <td>
              <img src="${coverUrl}" 
                   alt="${tool.tool_name}" 
                   class="tool-cover-thumb"
                   onerror="this.src='https://oss.am-all.com.cn/asset/img/main/default-tool.png'">
            </td>
            <td class="tool-name">${tool.tool_name}</td>
            <td>
              <span class="badge ${tool.category === 'chunithm' ? 'bg-primary' : 'bg-success'}">
                ${tool.category === 'chunithm' ? 'CHUNITHM' : 'BEMANI'}
              </span>
            </td>
            <td>
              <span class="badge ${tool.is_active ? 'bg-success' : 'bg-secondary'}">
                ${tool.is_active ? '激活' : '停用'}
              </span>
            </td>
            <td>
              <span class="badge bg-info">
                Rank ${tool.primary_access}
              </span>
            </td>
            <td>
              ${renderSecondaryAccess(tool.secondary_access)}
            </td>
            <td>${tool.sort_order}</td>
            <td>
              <button class="btn btn-sm btn-primary me-1" onclick="editTool(${tool.id})" title="编辑">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-sm btn-danger" onclick="deleteTool(${tool.id})" title="删除">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        `;
      }).join('');
      
      // 绑定复选框事件
      tbody.querySelectorAll('.tool-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', handleCheckboxChange);
      });
    }
    
    loadingState.style.display = 'none';
    tableContainer.style.display = 'block';
  }
  
  function renderSecondaryAccess(access) {
    if (!access) return '<span class="text-muted">-</span>';
    
    const accessMap = {
      '1': 'maimoller',
      '2': '协同管理员',
      'personal_auth': '个人认证',
      'official_auth': '官方认证'
    };
    
    return `<span class="badge bg-warning">${accessMap[access] || access}</span>`;
  }
  
  function handleCheckboxChange(e) {
    const id = parseInt(e.target.dataset.id);
    if (e.target.checked) {
      selectedToolIds.add(id);
    } else {
      selectedToolIds.delete(id);
    }
    updateBatchDeleteButton();
  }
  
  function toggleSelectAll(e) {
    const checkboxes = document.querySelectorAll('.tool-checkbox');
    checkboxes.forEach(cb => {
      cb.checked = e.target.checked;
      const id = parseInt(cb.dataset.id);
      if (e.target.checked) {
        selectedToolIds.add(id);
      } else {
        selectedToolIds.delete(id);
      }
    });
    updateBatchDeleteButton();
  }
  
  function selectAllTools() {
    const checkboxes = document.querySelectorAll('.tool-checkbox');
    checkboxes.forEach(cb => {
      cb.checked = true;
      selectedToolIds.add(parseInt(cb.dataset.id));
    });
    document.getElementById('select-all-checkbox').checked = true;
    updateBatchDeleteButton();
  }
  
  function deselectAllTools() {
    const checkboxes = document.querySelectorAll('.tool-checkbox');
    checkboxes.forEach(cb => {
      cb.checked = false;
    });
    document.getElementById('select-all-checkbox').checked = false;
    selectedToolIds.clear();
    updateBatchDeleteButton();
  }
  
  function updateBatchDeleteButton() {
    const btn = document.getElementById('batch-delete-btn');
    btn.disabled = selectedToolIds.size === 0;
    btn.innerHTML = selectedToolIds.size > 0 
      ? `<i class="fas fa-trash me-2"></i>删除选中 (${selectedToolIds.size})` 
      : '<i class="fas fa-trash me-2"></i>删除选中';
  }
  
  function showCreateToolModal(editData = null) {
    const isEdit = !!editData;
    
    // 处理封面图片URL
    let coverImageHtml = '';
    if (editData?.cover_image) {
      const coverUrl = getFullImageUrl(editData.cover_image);
      coverImageHtml = `<img src="${coverUrl}" alt="封面" onerror="this.parentElement.innerHTML='<div style=\'color:#999;padding:20px;\'>图片加载失败</div>'">`;
    }
    
    const modalHTML = `
      <div class="modal show" id="tool-modal">
        <div class="modal-content large">
          <div class="modal-header">
            <h3>${isEdit ? '编辑工具' : '新建工具'}</h3>
            <button class="modal-close" onclick="closeToolModal()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="tool-form">
              <input type="hidden" id="tool-id" value="${editData?.id || ''}">
              
              <div class="form-group">
                <label for="tool-name">工具名称 <span class="required">*</span></label>
                <input type="text" id="tool-name" class="form-control" 
                       value="${editData?.tool_name || ''}" required>
              </div>
              
              <div class="form-group">
                <label for="tool-category">工具分类 <span class="required">*</span></label>
                <select id="tool-category" class="form-control" required>
                  <option value="">请选择</option>
                  <option value="chunithm" ${editData?.category === 'chunithm' ? 'selected' : ''}>
                    CHUNITHM补丁工具
                  </option>
                  <option value="bemani" ${editData?.category === 'bemani' ? 'selected' : ''}>
                    BEMANI补丁工具
                  </option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="tool-path">工具路径 <span class="required">*</span></label>
                <input type="text" id="tool-path" class="form-control" 
                       placeholder="patcher/xxx.html" 
                       value="${editData?.tool_path || ''}" required>
                <small class="form-text">填写HTML文件的相对路径</small>
              </div>
              
              <div class="form-group">
                <label for="tool-cover">封面图片</label>
                <div class="cover-upload-area">
                  <input type="file" id="tool-cover-input" accept="image/*" style="display: none;">
                  <button type="button" class="btn btn-secondary" onclick="document.getElementById('tool-cover-input').click()">
                    <i class="fas fa-upload me-2"></i>
                    选择图片
                  </button>
                  <div id="cover-preview" class="cover-preview">
                    ${coverImageHtml}
                  </div>
                  <input type="hidden" id="tool-cover-path" value="${editData?.cover_image || ''}">
                  <small class="form-text">当前封面路径: <span id="cover-path-display">${editData?.cover_image || '未设置'}</span></small>
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="primary-access">一级访问权限 <span class="required">*</span></label>
                  <select id="primary-access" class="form-control" required>
                    <option value="0" ${editData?.primary_access === 0 ? 'selected' : ''}>普通用户 (0)</option>
                    <option value="1" ${editData?.primary_access === 1 ? 'selected' : ''}>初级用户 (1)</option>
                    <option value="2" ${editData?.primary_access === 2 ? 'selected' : ''}>中级用户 (2)</option>
                    <option value="3" ${editData?.primary_access === 3 ? 'selected' : ''}>高级用户 (3)</option>
                    <option value="4" ${editData?.primary_access === 4 ? 'selected' : ''}>贵宾用户 (4)</option>
                    <option value="5" ${editData?.primary_access === 5 ? 'selected' : ''}>管理员 (5)</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="secondary-access">二级访问权限</label>
                  <select id="secondary-access" class="form-control">
                    <option value="">无</option>
                    <option value="0" ${editData?.secondary_access === '1' ? 'selected' : ''}>maimoller</option>
                    <option value="1" ${editData?.secondary_access === '2' ? 'selected' : ''}>协同管理员</option>
                    <option value="personal_auth" ${editData?.secondary_access === 'personal_auth' ? 'selected' : ''}>
                      个人认证
                    </option>
                    <option value="official_auth" ${editData?.secondary_access === 'official_auth' ? 'selected' : ''}>
                      官方认证
                    </option>
                  </select>
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="sort-order">排序顺序</label>
                  <input type="number" id="sort-order" class="form-control" 
                         value="${editData?.sort_order || 0}" min="0">
                </div>
                
                <div class="form-group">
                  <label>
                    <input type="checkbox" id="is-active" 
                           ${editData?.is_active !== false ? 'checked' : ''}>
                    激活状态
                  </label>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeToolModal()">取消</button>
            <button type="button" class="btn btn-primary" onclick="saveTool()">${isEdit ? '保存' : '创建'}</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // 绑定文件上传
    document.getElementById('tool-cover-input').addEventListener('change', handleCoverUpload);
  }
  
async function handleCoverUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  if (file.size > 5 * 1024 * 1024) {
    alert('文件大小不能超过5MB');
    return;
  }
  
  const formData = new FormData();
  formData.append('cover', file);
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/admin/patcher-tools/cover`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('上传失败响应:', errorText);
      throw new Error('上传失败');
    }
    
    const data = await response.json();
    console.log('上传成功，服务器返回:', data);
    
    if (data.success && data.coverPath) {
      // 更新隐藏的路径输入框
      document.getElementById('tool-cover-path').value = data.coverPath;
      console.log('保存的路径值:', data.coverPath);
      
      // 更新路径显示
      const pathDisplay = document.getElementById('cover-path-display');
      if (pathDisplay) {
        pathDisplay.textContent = data.coverPath;
      }
      
      // 生成完整的图片URL
      const fullImageUrl = getFullImageUrl(data.coverPath);
      console.log('完整图片URL:', fullImageUrl);
      
      // 更新预览图片
      const previewContainer = document.getElementById('cover-preview');
      previewContainer.innerHTML = `
        <img src="${fullImageUrl}" 
             alt="封面预览" 
             style="max-width: 100%; max-height: 200px; object-fit: contain;"
             onerror="console.error('图片加载失败，URL:', this.src); this.parentElement.innerHTML='<div style=\\'color:#e74c3c;padding:20px;\\'>图片加载失败：' + this.src + '</div>'">
      `;
      
      // 测试图片是否可访问
      const img = new Image();
      img.onload = () => console.log('✓ 图片可以正常访问:', fullImageUrl);
      img.onerror = () => console.error('✗ 图片无法访问:', fullImageUrl);
      img.src = fullImageUrl;
      
      showSuccessMessage('封面上传成功');
    } else {
      throw new Error('服务器返回数据格式错误');
    }
  } catch (error) {
    console.error('上传封面失败:', error);
    alert('上传封面失败: ' + error.message);
  }
}
  
  window.closeToolModal = function() {
    const modal = document.getElementById('tool-modal');
    if (modal) modal.remove();
  };
  
  window.saveTool = async function() {
    const toolId = document.getElementById('tool-id').value;
    const isEdit = !!toolId;
    
    const data = {
      tool_name: document.getElementById('tool-name').value.trim(),
      category: document.getElementById('tool-category').value,
      tool_path: document.getElementById('tool-path').value.trim(),
      cover_image: document.getElementById('tool-cover-path').value,
      primary_access: parseInt(document.getElementById('primary-access').value),
      secondary_access: document.getElementById('secondary-access').value || null,
      sort_order: parseInt(document.getElementById('sort-order').value) || 0,
      is_active: document.getElementById('is-active').checked
    };
    
    console.log('保存工具数据:', data); // 调试日志
    
    if (!data.tool_name || !data.category || !data.tool_path) {
      alert('请填写所有必填字段');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const url = isEdit 
        ? `${API_BASE}/api/admin/patcher-tools/${toolId}`
        : `${API_BASE}/api/admin/patcher-tools`;
      
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(isEdit ? '更新失败' : '创建失败');
      }
      
      closeToolModal();
      showSuccessMessage(isEdit ? '工具更新成功' : '工具创建成功');
      await loadTools();
    } catch (error) {
      console.error('保存工具失败:', error);
      alert('保存工具失败: ' + error.message);
    }
  };
  
  window.editTool = function(toolId) {
    const tool = allTools.find(t => t.id === toolId);
    if (tool) {
      showCreateToolModal(tool);
    }
  };
  
  window.deleteTool = async function(toolId) {
    if (!confirm('确定要删除这个工具吗？此操作不可撤销！')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/admin/patcher-tools/${toolId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('删除失败');
      }
      
      showSuccessMessage('工具删除成功');
      await loadTools();
    } catch (error) {
      console.error('删除工具失败:', error);
      alert('删除工具失败: ' + error.message);
    }
  };
  
  async function batchDeleteTools() {
    if (selectedToolIds.size === 0) return;
    
    if (!confirm(`确定要删除选中的 ${selectedToolIds.size} 个工具吗？此操作不可撤销！`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/admin/patcher-tools/batch-delete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ids: Array.from(selectedToolIds)
        })
      });
      
      if (!response.ok) {
        throw new Error('批量删除失败');
      }
      
      showSuccessMessage('批量删除成功');
      selectedToolIds.clear();
      await loadTools();
    } catch (error) {
      console.error('批量删除失败:', error);
      alert('批量删除失败: ' + error.message);
    }
  }
  
  function showError(message) {
    const loadingState = document.querySelector('.loading-state');
    if (loadingState) {
      loadingState.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
          <p class="text-danger">${message}</p>
        </div>
      `;
    }
  }
  
  function showSuccessMessage(message) {
    if (typeof window.showSuccessMessage === 'function') {
      window.showSuccessMessage(message);
    } else {
      alert(message);
    }
  }
  
  // 全局暴露
  window.renderPatcherAdmin = renderPatcherAdmin;
  
})();