// download-admin.js - 下载管理功能（完整版 - 包含文件上传和标签页切换）
if (typeof window.API_BASE_URL === 'undefined') {
    window.API_BASE_URL = 'https://api.am-all.com.cn';
}

let currentDownloads = [];
let isSaving = false;
let downloadLinksCount = 1; // 下载链接计数器

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
  
  // 添加下载链接按钮事件
  const addLinkBtn = document.getElementById('add-download-link');
  if (addLinkBtn) {
    addLinkBtn.addEventListener('click', () => {
      addDownloadLink();
    });
  }
  
  // 初始化标签页切换
  initTabSwitching();
}

// 标签页切换函数
function initTabSwitching() {
  document.addEventListener('click', function(e) {
    // 检查是否点击了标签页按钮
    if (e.target.closest('.simple-tab-btn')) {
      const btn = e.target.closest('.simple-tab-btn');
      const tabName = btn.getAttribute('data-tab');
      
      // 移除所有active类
      document.querySelectorAll('.simple-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.simple-tab-pane').forEach(p => p.classList.remove('active'));
      
      // 添加active到当前标签
      btn.classList.add('active');
      const pane = document.getElementById(tabName + '-pane');
      if (pane) {
        pane.classList.add('active');
      }
    }
  });
}

// 加载所有下载项目
async function loadDownloads() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${window.API_BASE_URL}/api/admin/downloads`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('获取下载列表失败');
    }
    
    currentDownloads = await response.json();
    renderDownloads();
  } catch (error) {
    console.error('加载下载列表错误:', error);
    showErrorMessage('加载下载列表失败');
  }
}

// 渲染下载列表
function renderDownloads() {
  const tbody = document.getElementById('downloads-body');
  if (!tbody) return;
  
  if (currentDownloads.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center text-muted">暂无下载项目</td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = currentDownloads.map((download, index) => {
    const categoryMap = {
      'game': '游戏下载',
      'archive': '存档下载',
      'other': '其他资源'
    };
    
    const statusClass = download.is_active ? 'badge-success' : 'badge-secondary';
    const statusText = download.is_active ? '激活' : '禁用';
    
    return `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(download.title)}</td>
        <td>${categoryMap[download.category] || download.category}</td>
        <td><code>${download.page_id}</code></td>
        <td>${download.version || '-'}</td>
        <td>${download.file_count || 0}</td>
        <td>${download.last_update || '-'}</td>
        <td><span class="badge ${statusClass}">${statusText}</span></td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="editDownload(${download.id})">
            <i class="fas fa-edit"></i> 编辑
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteDownload(${download.id})">
            <i class="fas fa-trash"></i> 删除
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// 显示下载项目模态框
function showDownloadModal(download = null) {
  const modal = document.getElementById('download-modal');
  const modalTitle = document.getElementById('modal-title');
  const downloadId = document.getElementById('download-id');
  
  // 重置表单
  document.getElementById('download-form').reset();
  downloadLinksCount = 0;
  document.getElementById('download-links-container').innerHTML = '';
  
  // 重置标签页到第一个
  document.querySelectorAll('.simple-tab-btn').forEach((btn, index) => {
    if (index === 0) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  document.querySelectorAll('.simple-tab-pane').forEach((pane, index) => {
    if (index === 0) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });
  
  if (download) {
    // 编辑模式
    modalTitle.textContent = '编辑下载项目';
    downloadId.value = download.id;
    
    // 填充基本信息
    document.getElementById('download-title').value = download.title || '';
    document.getElementById('download-category').value = download.category || 'game';
    document.getElementById('download-page-id').value = download.page_id || '';
    document.getElementById('download-version').value = download.version || '';
    document.getElementById('download-file-count').value = download.file_count || 0;
    document.getElementById('download-last-update').value = download.last_update || '';
    document.getElementById('download-status').value = download.is_active ? '1' : '0';
    document.getElementById('download-image-url').value = download.image_url || '';
    document.getElementById('download-description').value = download.description || '';
    
    // 填充权限设置
    document.getElementById('download-access-level').value = download.access_level || '-1';
    document.getElementById('download-special-group').value = download.special_group || '';
    document.getElementById('download-required-points').value = download.required_points || 0;
    
    // 填充下载链接
    if (download.download_links && Array.isArray(download.download_links)) {
      download.download_links.forEach((link) => {
        addDownloadLink();
        const linkIndex = downloadLinksCount;
        document.getElementById(`link-method-${linkIndex}`).value = link.method || '';
        document.getElementById(`link-url-${linkIndex}`).value = link.url || '';
        document.getElementById(`link-password-${linkIndex}`).value = link.password || '';
        document.getElementById(`link-validity-${linkIndex}`).value = link.validity || '';
      });
    } else {
      addDownloadLink();
    }
    
    // 文件管理 - 显示上传按钮和文件列表
    const uploadBtn = document.getElementById('upload-file-btn');
    if (uploadBtn) {
      uploadBtn.style.display = 'inline-block';
      uploadBtn.onclick = () => showFileUploadDialog(download.id);
    }
    
    // 修改文件列表容器的ID
    const filesContainer = document.getElementById('files-list-container');
    if (filesContainer) {
      filesContainer.id = `files-${download.id}`;
      // 加载文件列表
      loadDownloadFiles(download.id);
    }
    
  } else {
    // 新建模式
    modalTitle.textContent = '新建下载项目';
    downloadId.value = '';
    addDownloadLink();
    
    // 隐藏文件上传功能
    const uploadBtn = document.getElementById('upload-file-btn');
    if (uploadBtn) {
      uploadBtn.style.display = 'none';
    }
    
    const filesContainer = document.getElementById('files-list-container');
    if (filesContainer) {
      filesContainer.id = 'files-list-container';
      filesContainer.innerHTML = `
        <div class="alert alert-info">
          <i class="fas fa-info-circle"></i> 
          请先保存下载项目，然后才能上传文件。
        </div>
      `;
    }
  }
  
  modal.style.display = 'block';
}

// 编辑下载项目
async function editDownload(id) {
  try {
    const download = currentDownloads.find(d => d.id === id);
    if (!download) {
      throw new Error('下载项目不存在');
    }
    
    console.log('开始编辑下载项目，ID:', id);
    
    // 获取完整的下载项目信息（包括下载链接）
    const token = localStorage.getItem('token');
    const url = `${window.API_BASE_URL}/api/admin/downloads/${id}`;
    
    console.log('请求URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('响应状态:', response.status);
    
    if (!response.ok) {
      // 如果获取详情失败，使用列表中的基本数据
      console.warn('获取详情失败，使用列表数据');
      showDownloadModal(download);
      return;
    }
    
    const fullDownload = await response.json();
    console.log('获取到完整数据:', fullDownload);
    showDownloadModal(fullDownload);
    
  } catch (error) {
    console.error('编辑下载项目错误:', error);
    
    // 尝试使用列表中的基本数据作为后备
    const download = currentDownloads.find(d => d.id === id);
    if (download) {
      console.log('使用列表数据作为后备');
      showDownloadModal(download);
    } else {
      showErrorMessage('加载下载项目失败: ' + error.message);
    }
  }
}

// 关闭模态框
function closeDownloadModal() {
  const modal = document.getElementById('download-modal');
  modal.style.display = 'none';
  
  // 重置文件列表容器ID
  const filesContainer = document.querySelector('[id^="files-"]');
  if (filesContainer) {
    filesContainer.id = 'files-list-container';
  }
}

// 添加下载链接输入组
function addDownloadLink() {
  const container = document.getElementById('download-links-container');
  const linkId = ++downloadLinksCount;
  
  const linkHtml = `
    <div class="download-link-item" id="link-item-${linkId}">
      <div class="download-link-header">
        <h5>下载链接 ${linkId}</h5>
        <button type="button" class="btn-remove" onclick="removeDownloadLink(${linkId})">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>下载方式</label>
          <select class="form-control" id="link-method-${linkId}">
            <option value="百度网盘">百度网盘</option>
            <option value="OneDrive">OneDrive</option>
            <option value="Google Drive">Google Drive</option>
            <option value="直链">直链</option>
            <option value="其他">其他</option>
          </select>
        </div>
        <div class="form-group">
          <label>下载链接</label>
          <input type="url" class="form-control" id="link-url-${linkId}" placeholder="https://...">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>提取码/访问密码</label>
          <input type="text" class="form-control" id="link-password-${linkId}" placeholder="留空表示无密码">
        </div>
        <div class="form-group">
          <label>资源有效期</label>
          <input type="text" class="form-control" id="link-validity-${linkId}" placeholder="例如: 永久有效">
        </div>
      </div>
    </div>
  `;
  
  container.insertAdjacentHTML('beforeend', linkHtml);
}

// 移除下载链接
function removeDownloadLink(linkId) {
  const linkItem = document.getElementById(`link-item-${linkId}`);
  if (linkItem) {
    linkItem.remove();
  }
}

// 收集下载链接数据
function collectDownloadLinks() {
  const links = [];
  const container = document.getElementById('download-links-container');
  const linkItems = container.querySelectorAll('.download-link-item');
  
  linkItems.forEach((item) => {
    const linkId = item.id.replace('link-item-', '');
    const method = document.getElementById(`link-method-${linkId}`)?.value;
    const url = document.getElementById(`link-url-${linkId}`)?.value;
    const password = document.getElementById(`link-password-${linkId}`)?.value;
    const validity = document.getElementById(`link-validity-${linkId}`)?.value;
    
    if (url) {
      links.push({
        method: method || '百度网盘',
        url: url,
        password: password || '',
        validity: validity || '永久有效'
      });
    }
  });
  
  return links;
}

// 保存下载项目
async function saveDownload() {
  if (isSaving) return;
  isSaving = true;
  
  const saveBtn = document.querySelector('#download-form button[type="submit"]');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 保存中...';
  }
  
  try {
    const id = document.getElementById('download-id').value;
    const downloadLinks = collectDownloadLinks();
    
    const downloadData = {
      title: document.getElementById('download-title').value,
      category: document.getElementById('download-category').value,
      page_id: document.getElementById('download-page-id').value,
      version: document.getElementById('download-version').value || null,
      file_count: parseInt(document.getElementById('download-file-count').value) || 0,
      last_update: document.getElementById('download-last-update').value || null,
      is_active: parseInt(document.getElementById('download-status').value),
      image_url: document.getElementById('download-image-url').value || null,
      description: document.getElementById('download-description').value || null,
      access_level: parseInt(document.getElementById('download-access-level').value),
      special_group: document.getElementById('download-special-group').value || null,
      required_points: parseInt(document.getElementById('download-required-points').value) || 0,
      download_links: downloadLinks
    };
    
    console.log('保存下载项目数据:', downloadData);
    
    const token = localStorage.getItem('token');
    const url = id ? 
      `${window.API_BASE_URL}/api/admin/downloads/${id}` : 
      `${window.API_BASE_URL}/api/admin/downloads`;
    
    const response = await fetch(url, {
      method: id ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(downloadData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '保存下载项目失败');
    }
    
    const result = await response.json();
    console.log('保存成功，返回数据:', result);
    
    // 判断是创建还是更新
    const isNewItem = !id;
    const newItemId = result.id || result.download?.id || result.data?.id;
    
    if (isNewItem && newItemId) {
      // 新建项目 - 不关闭模态框，而是切换到编辑模式
      console.log('新建项目成功，ID:', newItemId);
      showSuccessMessage('下载项目创建成功！现在可以上传文件了');
      
      // 等待一小段时间后重新加载该项目（进入编辑模式）
      setTimeout(async () => {
        try {
          // 重新获取完整数据
          const token = localStorage.getItem('token');
          const detailResponse = await fetch(`${window.API_BASE_URL}/api/admin/downloads/${newItemId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (detailResponse.ok) {
            const fullDownload = await detailResponse.json();
            // 关闭当前模态框
            closeDownloadModal();
            // 重新加载列表
            await loadDownloads();
            // 延迟一点再打开编辑模态框
            setTimeout(() => {
              showDownloadModal(fullDownload);
              // 自动切换到文件管理标签页
              const filesTab = document.querySelector('[data-tab="files"]');
              if (filesTab) {
                filesTab.click();
              }
            }, 300);
          } else {
            // 如果获取详情失败，就正常关闭
            closeDownloadModal();
            loadDownloads();
          }
        } catch (error) {
          console.error('重新加载项目详情失败:', error);
          closeDownloadModal();
          loadDownloads();
        }
      }, 500);
      
    } else {
      // 更新项目 - 正常流程
      showSuccessMessage('下载项目更新成功');
      closeDownloadModal();
      loadDownloads();
    }
    
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

// ============================================
// 文件上传功能
// 添加日期: 2025-11-05
// ============================================

// 显示文件上传对话框
function showFileUploadDialog(downloadId) {
  const modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.id = 'fileUploadModal';
  modal.style.display = 'block';
  modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">上传文件</h5>
          <button type="button" class="btn-close" onclick="closeFileUploadModal()">×</button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">选择文件</label>
            <input type="file" class="form-control" id="fileInput" accept="*/*">
            <div class="form-text">
              支持的文件类型：ZIP, RAR, 7Z, PDF, EXE, ISO, 图片等<br>
              最大文件大小：5GB
            </div>
          </div>
          
          <div id="uploadProgress" style="display: none;">
            <div class="progress mb-2" style="height: 25px;">
              <div class="progress-bar progress-bar-striped progress-bar-animated" 
                   id="progressBar" 
                   role="progressbar" 
                   style="width: 0%">0%</div>
            </div>
            <div id="uploadStatus" class="text-center"></div>
          </div>
          
          <div id="uploadResult" style="display: none;">
            <div class="alert alert-success">
              <i class="fas fa-check-circle"></i> 文件上传成功！
              <div id="fileInfo" class="mt-2"></div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeFileUploadModal()">取消</button>
          <button type="button" class="btn btn-primary" id="uploadBtn" onclick="uploadFile(${downloadId})">
            <i class="fas fa-upload"></i> 上传
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // 点击背景关闭
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeFileUploadModal();
    }
  });
}

// 关闭文件上传对话框
function closeFileUploadModal() {
  const modal = document.getElementById('fileUploadModal');
  if (modal) {
    modal.remove();
  }
}

// 上传文件函数
async function uploadFile(downloadId) {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  
  if (!file) {
    showToast('请选择要上传的文件', 'warning');
    return;
  }
  
  // 检查文件大小（5GB限制）
  const maxSize = 5 * 1024 * 1024 * 1024;
  if (file.size > maxSize) {
    showToast('文件大小超过5GB限制', 'error');
    return;
  }
  
  const uploadBtn = document.getElementById('uploadBtn');
  const uploadProgress = document.getElementById('uploadProgress');
  const progressBar = document.getElementById('progressBar');
  const uploadStatus = document.getElementById('uploadStatus');
  const uploadResult = document.getElementById('uploadResult');
  const fileInfo = document.getElementById('fileInfo');
  
  // 禁用上传按钮
  uploadBtn.disabled = true;
  fileInput.disabled = true;
  
  // 显示进度条
  uploadProgress.style.display = 'block';
  uploadResult.style.display = 'none';
  progressBar.style.width = '0%';
  progressBar.textContent = '0%';
  uploadStatus.textContent = '正在上传...';
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('download_id', downloadId);
    
    const token = localStorage.getItem('token');
    
    // 使用 XMLHttpRequest 以支持进度显示
    const xhr = new XMLHttpRequest();
    
    // 上传进度
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = Math.round((e.loaded / e.total) * 100);
        progressBar.style.width = percentComplete + '%';
        progressBar.textContent = percentComplete + '%';
        uploadStatus.textContent = `正在上传... ${percentComplete}%`;
      }
    });
    
    // 上传完成
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const result = JSON.parse(xhr.responseText);
        
        // 显示成功信息
        progressBar.style.width = '100%';
        progressBar.textContent = '100%';
        uploadStatus.textContent = '上传完成！';
        
        setTimeout(() => {
          uploadProgress.style.display = 'none';
          uploadResult.style.display = 'block';
          
          fileInfo.innerHTML = `
            <strong>文件名：</strong> ${escapeHtml(result.file.name)}<br>
            <strong>文件大小：</strong> ${formatFileSize(result.file.size)}<br>
            <strong>文件ID：</strong> ${result.file.id}
          `;
          
          // 3秒后关闭对话框并刷新列表
          setTimeout(() => {
            closeFileUploadModal();
            loadDownloadFiles(downloadId);
            showToast('文件上传成功', 'success');
          }, 3000);
        }, 500);
      } else {
        const errorData = JSON.parse(xhr.responseText);
        throw new Error(errorData.error || '上传失败');
      }
    });
    
    // 上传错误
    xhr.addEventListener('error', () => {
      throw new Error('网络错误');
    });
    
    xhr.open('POST', `${window.API_BASE_URL}/api/admin/download-files/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
    
  } catch (error) {
    console.error('上传错误:', error);
    uploadProgress.style.display = 'none';
    showToast(error.message || '文件上传失败', 'error');
    uploadBtn.disabled = false;
    fileInput.disabled = false;
  }
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// 加载下载文件列表
async function loadDownloadFiles(downloadId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${window.API_BASE_URL}/api/admin/download-files/${downloadId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('加载文件列表失败');
    }
    
    const files = await response.json();
    displayDownloadFiles(files, downloadId);
    
  } catch (error) {
    console.error('加载文件列表错误:', error);
    showToast('加载文件列表失败', 'error');
  }
}

// 显示文件列表
function displayDownloadFiles(files, downloadId) {
  const container = document.getElementById(`files-${downloadId}`);
  
  if (!container) {
    console.warn('文件列表容器不存在:', `files-${downloadId}`);
    return;
  }
  
  if (files.length === 0) {
    container.innerHTML = `
      <div class="alert alert-info">
        <i class="fas fa-info-circle"></i> 暂无上传的文件
      </div>
    `;
    return;
  }
  
  const fileList = files.map(file => `
    <div class="file-item mb-2 p-3 border rounded">
      <div class="d-flex justify-content-between align-items-center">
        <div class="flex-grow-1">
          <h6 class="mb-1">
            <i class="fas fa-file"></i> ${escapeHtml(file.file_name)}
          </h6>
          <small class="text-muted">
            大小: ${formatFileSize(file.file_size)} | 
            下载次数: ${file.download_count} | 
            上传者: ${escapeHtml(file.uploader_nickname || file.uploader_name)} | 
            上传时间: ${formatDateTime(file.created_at)}
          </small>
        </div>
        <div class="btn-group">
          <button class="btn btn-sm btn-primary" onclick="copyDownloadUrl(${file.id})">
            <i class="fas fa-link"></i> 复制链接
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteDownloadFile(${file.id}, ${downloadId})">
            <i class="fas fa-trash"></i> 删除
          </button>
        </div>
      </div>
    </div>
  `).join('');
  
  container.innerHTML = fileList;
}

// 复制下载URL
function copyDownloadUrl(fileId) {
  const url = `${window.API_BASE_URL}/api/download-files/${fileId}/download`;
  
  // 创建临时输入框
  const tempInput = document.createElement('input');
  tempInput.value = url;
  document.body.appendChild(tempInput);
  tempInput.select();
  
  try {
    document.execCommand('copy');
    showToast('下载链接已复制到剪贴板', 'success');
  } catch (err) {
    // 如果旧方法失败，尝试新的 Clipboard API
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        showToast('下载链接已复制到剪贴板', 'success');
      }).catch(() => {
        showToast('复制失败，请手动复制', 'error');
      });
    } else {
      showToast('复制失败，请手动复制', 'error');
    }
  }
  
  document.body.removeChild(tempInput);
}

// 删除上传的文件
async function deleteDownloadFile(fileId, downloadId) {
  if (!confirm('确定要删除这个文件吗？此操作不可恢复！')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${window.API_BASE_URL}/api/admin/download-files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('删除文件失败');
    }
    
    showToast('文件已删除', 'success');
    loadDownloadFiles(downloadId);
    
  } catch (error) {
    console.error('删除文件错误:', error);
    showToast(error.message || '删除文件失败', 'error');
  }
}

// 格式化日期时间
function formatDateTime(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// HTML转义函数（防止XSS）
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// 显示Toast提示
function showToast(message, type = 'info') {
  // 如果存在全局的 showSuccessMessage 或 showErrorMessage，优先使用
  if (type === 'success' && typeof showSuccessMessage === 'function') {
    showSuccessMessage(message);
    return;
  }
  if (type === 'error' && typeof showErrorMessage === 'function') {
    showErrorMessage(message);
    return;
  }
  
  // 否则创建简单的 toast
  const toast = document.createElement('div');
  const alertClass = type === 'error' ? 'danger' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'info';
  toast.className = `alert alert-${alertClass} position-fixed top-0 end-0 m-3`;
  toast.style.zIndex = '9999';
  toast.style.minWidth = '300px';
  toast.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
    ${message}
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// 兼容旧版本的消息显示函数
if (typeof showSuccessMessage === 'undefined') {
  window.showSuccessMessage = function(message) {
    showToast(message, 'success');
  };
}

if (typeof showErrorMessage === 'undefined') {
  window.showErrorMessage = function(message) {
    showToast(message, 'error');
  };
}

console.log('✅ 下载管理和文件上传功能已加载');