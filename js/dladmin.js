// Injected API base detection
var API_BASE=(typeof window!=='undefined' && window.API_BASE!==undefined ? window.API_BASE : ((location && (location.hostname==='127.0.0.1'||location.hostname==='localhost'))    ? 'https://api.am-all.com.cn' : ''));
// download-admin.js - 下载管理功能
if (typeof window.API_BASE_URL === 'undefined') {
    window.API_BASE_URL = 'https://api.am-all.com.cn';
}

let currentDownloads = [];
let isSaving = false;

// 初始化下载管理页面
function initDownloadAdminPage() {
  loadDownloads();
  
  document.getElementById('create-download-btn').addEventListener('click', () => {
    showDownloadModal();
  });
  
  const downloadForm = document.getElementById('download-form');
  if (downloadForm) {
    downloadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveDownload();
    });
  }
  
  document.getElementById('cancel-download-btn').addEventListener('click', () => {
    closeDownloadModal();
  });
  
  const closeBtn = document.querySelector('#download-modal .close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closeDownloadModal();
    });
  }
  
  window.addEventListener('click', (e) => {
    if (e.target === document.getElementById('download-modal')) {
      closeDownloadModal();
    }
  });
}

// 加载下载项目列表
async function loadDownloads() {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      showLoginRequired('download-admin');
      return;
    }
    
    const response = await fetch(`${window.API_BASE_URL}/api/admin/downloads`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('获取下载列表失败');
    }
    
    currentDownloads = await response.json();
    console.log('下载管理数据加载成功:', currentDownloads.length, '条记录');
    renderDownloads(currentDownloads);
  } catch (error) {
    console.error('加载下载项目错误:', error);
    showErrorMessage('加载下载项目失败: ' + error.message);
  }
}

// 渲染下载项目列表
function renderDownloads(downloads) {
  const tbody = document.getElementById('downloads-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (downloads.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center">没有下载项目</td></tr>`;
    return;
  }
  
  const categoryNames = {
    'game': '游戏下载',
    'archive': '存档下载',
    'other': '其他资源'
  };
  
  // 按ID排序，确保显示顺序一致
  const sortedDownloads = [...downloads].sort((a, b) => a.id - b.id);
  
  sortedDownloads.forEach((download, index) => {
    const tr = document.createElement('tr');
    
    tr.innerHTML = `
      <td>${index + 1}</td>  <!-- 使用自然序号 -->
      <td>${download.title}</td>
      <td>${categoryNames[download.category] || download.category}</td>
      <td>${download.page_id}</td>
      <td>${download.version || '-'}</td>
      <td>${download.file_count || '0'}</td>
      <td>${download.last_update || '-'}</td>
      <td>${download.is_active ? '<span class="badge bg-success">激活</span>' : '<span class="badge bg-secondary">禁用</span>'}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary edit-download" data-id="${download.id}">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger delete-download" data-id="${download.id}">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    
    tbody.appendChild(tr);
  });
  
  // 添加编辑和删除事件
  document.querySelectorAll('.edit-download').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const download = currentDownloads.find(d => d.id == id);
      if (download) {
        showDownloadModal(download);
      }
    });
  });
  
  document.querySelectorAll('.delete-download').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      deleteDownload(id);
    });
  });
}

// 显示下载项目模态框
function showDownloadModal(download = null) {
  const modal = document.getElementById('download-modal');
  const form = document.getElementById('download-form');
  const title = document.getElementById('modal-title');
  
  if (!modal || !form || !title) return;
  
  if (download) {
    title.textContent = '编辑下载项目';
    document.getElementById('download-id').value = download.id;
    document.getElementById('download-title').value = download.title;
    document.getElementById('download-version').value = download.version || '';
    document.getElementById('download-file-count').value = download.file_count || '';
    document.getElementById('download-category').value = download.category;
    document.getElementById('download-baidu-url').value = download.baidu_url || '';
    document.getElementById('download-baidu-code').value = download.baidu_code || '';
    document.getElementById('download-last-update').value = download.last_update || '';
    document.getElementById('download-page-id').value = download.page_id || '';
    document.getElementById('download-description').value = download.description || '';
    document.getElementById('download-image-url').value = download.image_url || '';
    document.getElementById('download-status').value = download.is_active ? '1' : '0';
    document.getElementById('download-access-level').value = download.access_level || '0';
	document.getElementById('download-special-group').value = download.special_group || '';
	document.getElementById('download-required-points').value = download.required_points || 0;
  } else {
    title.textContent = '新建下载项目';
    form.reset();
    document.getElementById('download-id').value = '';
    document.getElementById('download-status').value = '1';
    document.getElementById('download-access-level').value = '0';
    document.getElementById('download-special-group').value = '';
    document.getElementById('download-required-points').value = 0;
  }
  
  modal.style.display = 'block';
  modal.classList.add('show');
}

// 关闭下载项目模态框
function closeDownloadModal() {
  const modal = document.getElementById('download-modal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('show');
  }
}

// 保存下载项目
async function saveDownload() {
  if (isSaving) {
    console.log('正在保存中，请勿重复提交');
    return;
  }
  
  try {
    isSaving = true;
    const saveBtn = document.querySelector('#download-form button[type="submit"]');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 保存中...';
    }
    
    const form = document.getElementById('download-form');
    if (!form) return;
    
    const id = document.getElementById('download-id').value;
    const title = document.getElementById('download-title').value;
    const version = document.getElementById('download-version').value;
    const file_count = document.getElementById('download-file-count').value;
    const category = document.getElementById('download-category').value;
    const baidu_url = document.getElementById('download-baidu-url').value;
    const baidu_code = document.getElementById('download-baidu-code').value;
    const last_update = document.getElementById('download-last-update').value;
    const page_id = document.getElementById('download-page-id').value;
    const description = document.getElementById('download-description').value;
    const image_url = document.getElementById('download-image-url').value;
    const is_active = document.getElementById('download-status').value === '1';
	const access_level = document.getElementById('download-access-level').value;
	const special_group = document.getElementById('download-special-group').value;
	const required_points = document.getElementById('download-required-points').value;
    
    console.log('保存下载项目:', { id, title, page_id });
    
    if (!title || !category || !page_id) {
      showErrorMessage('标题、分类和页面ID不能为空');
      return;
    }
    
    const token = localStorage.getItem('token');
    let url, method;
    
    if (id) {
      url = `${window.API_BASE_URL}/api/admin/downloads/${id}`;
      method = 'PUT';
    } else {
      url = `${window.API_BASE_URL}/api/admin/downloads`;
      method = 'POST';
    }
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        version,
        file_count: file_count ? parseInt(file_count) : null,
        category,
        baidu_url,
        baidu_code,
        last_update,
        page_id,
        description,
        image_url,
        is_active,
        access_level: parseInt(access_level) || 0,
        special_group: special_group || null,
        required_points: parseInt(required_points) || 0
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '保存下载项目失败');
    }
    
    closeDownloadModal();
    loadDownloads();
    // 确保显示正确的成功消息
    showSuccessMessage(`下载项目${id ? '更新' : '创建'}成功`);
  } catch (error) {
    console.error('保存下载项目错误:', error);
    showErrorMessage(`保存下载项目失败: ${error.message}`);
  } finally {
    isSaving = false;
    const saveBtn = document.querySelector('#download-form button[type="submit"]');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '保存';
    }
  }
}

// 删除下载项目
async function deleteDownload(id) {
  try {
    if (!id) return;
    
    if (!confirm('确定要删除这个下载项目吗？此操作不可撤销！')) {
      return;
    }
    
    const token = localStorage.getItem('token');
    const response = await fetch(`${window.API_BASE_URL}/api/admin/downloads/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('删除下载项目失败');
    }
    
    loadDownloads();
    showSuccessMessage('下载项目已删除');
  } catch (error) {
    console.error('删除下载项目错误:', error);
    showErrorMessage('删除下载项目失败: ' + error.message);
  }
}