// download-admin.js - 下载管理功能（修复版 - 增强错误处理）
if (typeof window.API_BASE_URL === 'undefined') {
    window.API_BASE_URL = 'https://api.am-all.com.cn';
}



// 与后端一致的排序比较函数：先按 sort_order 升序，其次按 created_at 降序
function compareBySortOrderAndDate(a, b) {
  const sa = Number(a && a.sort_order || 0);
  const sb = Number(b && b.sort_order || 0);
  if (sa !== sb) return sa - sb;
  const ta = (a && a.created_at) ? new Date(a.created_at).getTime() : 0;
  const tb = (b && b.created_at) ? new Date(b.created_at).getTime() : 0;
  return (isFinite(tb) ? tb : 0) - (isFinite(ta) ? ta : 0);
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
    
    // 解析所有下载项目的download_links
    currentDownloads = currentDownloads.map(download => {
      if (download.download_links) {
        try {
          if (typeof download.download_links === 'string') {
            download.download_links = JSON.parse(download.download_links);
          }
        } catch (e) {
          console.error('解析download_links失败:', download.id, e);
          download.download_links = [];
        }
      } else {
        download.download_links = [];
      }
      return download;
    });
    
    // 服务器已按排序返回；为避免外部改动，这里再幂等排序一次
    currentDownloads.sort(compareBySortOrderAndDate);
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
    // 新增：排序ID回填
    var soEl = document.getElementById('download-sort-order');
    if (soEl) soEl.value = Number(download.sort_order || 0);
    
    // 填充权限设置
    document.getElementById('download-access-level').value = download.access_level ?? '-1';
    document.getElementById('download-special-group').value = download.special_group || '';
    document.getElementById('download-required-points').value = download.required_points || 0;
    
    // 填充下载链接
    console.log('下载链接数据:', download.download_links);
    if (download.download_links && Array.isArray(download.download_links) && download.download_links.length > 0) {
      download.download_links.forEach((link) => {
        addDownloadLink();
        const linkIndex = downloadLinksCount;
        
        setTimeout(() => {
          const methodField = document.getElementById(`link-method-${linkIndex}`);
          const nameField = document.getElementById(`link-name-${linkIndex}`);
          const urlField = document.getElementById(`link-url-${linkIndex}`);
          const passwordField = document.getElementById(`link-password-${linkIndex}`);
          const fileIdField = document.getElementById(`link-file-id-${linkIndex}`);
          
          if (methodField) methodField.value = link.method || 'baidu';
          if (nameField) nameField.value = link.name || '';
          if (urlField) urlField.value = link.url || '';
          if (passwordField) passwordField.value = link.password || '';
          
          // 如果是直链，设置file_id并触发方式切换
          if (link.method === 'direct') {
            if (fileIdField) fileIdField.value = link.file_id || '';
            handleMethodChange(linkIndex);
            
            // 显示已上传状态
            if (link.file_id && link.url) {
              const uploadContainer = document.getElementById(`upload-container-${linkIndex}`);
              if (uploadContainer) {
                uploadContainer.innerHTML = `
                  <div class="alert alert-success">
                    <i class="fas fa-check-circle"></i> 文件已上传
                    <button type="button" class="btn btn-sm btn-danger" onclick="clearUploadedFile(${linkIndex})">
                      <i class="fas fa-times"></i> 清除
                    </button>
                  </div>
                `;
              }
            }
          } else {
            handleMethodChange(linkIndex);
          }
        }, 50);
      });
    } else {
      addDownloadLink();
    }
  } else {
    // 新建模式
    modalTitle.textContent = '新建下载项目';
    downloadId.value = '';
    var soEl = document.getElementById('download-sort-order');
    if (soEl) soEl.value = 0;
    addDownloadLink();
  }
  
  modal.style.display = 'block';
}

// 添加下载链接输入框
function addDownloadLink() {
  downloadLinksCount++;
  const container = document.getElementById('download-links-container');
  const linkId = downloadLinksCount;
  
  const linkHtml = `
    <div class="download-link-item" id="link-item-${linkId}">
      <div class="link-header">
        <h5>链接 #${linkId}</h5>
        <button type="button" class="btn btn-sm btn-danger" onclick="removeDownloadLink(${linkId})">
          <i class="fas fa-trash"></i> 删除
        </button>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label>下载方式</label>
          <select class="form-control" id="link-method-${linkId}" onchange="handleMethodChange(${linkId})">
            <option value="baidu">百度网盘</option>
            <option value="123pan">123网盘</option>
            <option value="onedrive">One Drive</option>
            <option value="direct">直链</option>
            <option value="other">其他</option>
          </select>
        </div>
        <div class="form-group">
          <label>链接名称</label>
          <input type="text" class="form-control" id="link-name-${linkId}" placeholder="如：百度网盘">
        </div>
      </div>
      
      <div class="form-group">
        <label>下载链接</label>
        <input type="url" class="form-control" id="link-url-${linkId}" placeholder="输入下载链接">
        <div id="upload-container-${linkId}" style="display: none; margin-top: 10px;">
          <input type="file" id="file-input-${linkId}" class="form-control" style="display: none;">
          <button type="button" class="btn btn-success btn-sm" onclick="triggerFileUpload(${linkId})">
            <i class="fas fa-cloud-upload-alt"></i> 上传文件到服务器
          </button>
          <div id="upload-progress-${linkId}" style="display: none; margin-top: 10px;">
            <div class="progress">
              <div class="progress-bar" role="progressbar" style="width: 0%">0%</div>
            </div>
            <small class="text-muted" id="upload-status-${linkId}">准备上传...</small>
          </div>
        </div>
      </div>
      
      <div class="form-group">
        <label>提取码/访问密码</label>
        <input type="text" class="form-control" id="link-password-${linkId}" placeholder="如果需要的话">
      </div>
      
      <input type="hidden" id="link-file-id-${linkId}">
    </div>
  `;
  
  container.insertAdjacentHTML('beforeend', linkHtml);
}

// 处理下载方式切换
function handleMethodChange(linkId) {
  const method = document.getElementById(`link-method-${linkId}`).value;
  const urlField = document.getElementById(`link-url-${linkId}`);
  const uploadContainer = document.getElementById(`upload-container-${linkId}`);
  const passwordField = document.getElementById(`link-password-${linkId}`);
  
  if (method === 'direct') {
    // 直链模式：禁用手动输入，显示上传控件
    urlField.readOnly = true;
    urlField.placeholder = '上传文件后自动生成';
    uploadContainer.style.display = 'block';
    passwordField.disabled = true;
    passwordField.value = '';
  } else if (method === 'other') {
    // 其他模式：允许手动输入外部直链，不能上传
    urlField.readOnly = false;
    urlField.placeholder = '输入外部直链';
    uploadContainer.style.display = 'none';
    passwordField.disabled = true;
    passwordField.value = '';
  } else {
    // 网盘模式：允许手动输入，不显示上传控件
    urlField.readOnly = false;
    urlField.placeholder = '输入下载链接';
    uploadContainer.style.display = 'none';
    passwordField.disabled = false;
  }
}

// 触发文件上传
function triggerFileUpload(linkId) {
  const fileInput = document.getElementById(`file-input-${linkId}`);
  fileInput.click();
  
  fileInput.onchange = async () => {
    const file = fileInput.files[0];
    if (!file) return;
    
    await uploadFile(linkId, file);
  };
}

// 上传文件到服务器
async function uploadFile(linkId, file) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未登录，请先登录');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    const progressContainer = document.getElementById(`upload-progress-${linkId}`);
    const progressBar = progressContainer.querySelector('.progress-bar');
    const uploadStatus = document.getElementById(`upload-status-${linkId}`);
    progressContainer.style.display = 'block';
    uploadStatus.textContent = '正在上传...';
    
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
        try {
          const result = JSON.parse(xhr.responseText);
          console.log('上传成功，返回数据:', result);
          
          if (result.success && result.file) {
            // 设置文件URL和ID
            const urlField = document.getElementById(`link-url-${linkId}`);
            const fileIdField = document.getElementById(`link-file-id-${linkId}`);
            
            // 生成文件访问URL
            const fileUrl = `https://api.am-all.com.cn/api/files/download/${result.file.id}`;
            console.log('生成的文件URL:', fileUrl);
            
            urlField.value = fileUrl;
            fileIdField.value = result.file.id;
            
            // 显示成功提示
            progressContainer.style.display = 'none';
            const uploadContainer = document.getElementById(`upload-container-${linkId}`);
            uploadContainer.innerHTML = `
              <div class="alert alert-success">
                <i class="fas fa-check-circle"></i> 文件上传成功：${escapeHtml(result.file.name)}
                <br><small>文件ID: ${result.file.id}</small>
                <button type="button" class="btn btn-sm btn-danger mt-2" onclick="clearUploadedFile(${linkId})">
                  <i class="fas fa-times"></i> 清除
                </button>
              </div>
            `;
            
            showSuccessMessage('文件上传成功');
          } else {
            throw new Error('服务器返回数据格式错误');
          }
        } catch (parseError) {
          console.error('解析响应失败:', parseError, xhr.responseText);
          throw new Error('解析服务器响应失败');
        }
      } else {
        // 尝试解析错误信息
        let errorMsg = '上传失败';
        try {
          const errorData = JSON.parse(xhr.responseText);
          errorMsg = errorData.error || errorData.message || errorMsg;
        } catch (e) {
          errorMsg = `HTTP ${xhr.status}: ${xhr.statusText}`;
        }
        throw new Error(errorMsg);
      }
    });
    
    // 上传错误
    xhr.addEventListener('error', () => {
      throw new Error('网络错误，请检查网络连接');
    });
    
    // 超时处理
    xhr.addEventListener('timeout', () => {
      throw new Error('上传超时，请重试');
    });
    
    xhr.timeout = 300000; // 5分钟超时
    xhr.open('POST', `${window.API_BASE_URL}/api/admin/download-files/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
    
  } catch (error) {
    console.error('上传错误:', error);
    showErrorMessage('文件上传失败: ' + error.message);
    const progressContainer = document.getElementById(`upload-progress-${linkId}`);
    if (progressContainer) {
      progressContainer.style.display = 'none';
    }
  }
}

// 清除已上传的文件
function clearUploadedFile(linkId) {
  const urlField = document.getElementById(`link-url-${linkId}`);
  const fileIdField = document.getElementById(`link-file-id-${linkId}`);
  const uploadContainer = document.getElementById(`upload-container-${linkId}`);
  
  urlField.value = '';
  fileIdField.value = '';
  
  uploadContainer.innerHTML = `
    <input type="file" id="file-input-${linkId}" class="form-control" style="display: none;">
    <button type="button" class="btn btn-success btn-sm" onclick="triggerFileUpload(${linkId})">
      <i class="fas fa-cloud-upload-alt"></i> 上传文件到服务器
    </button>
    <div id="upload-progress-${linkId}" style="display: none; margin-top: 10px;">
      <div class="progress">
        <div class="progress-bar" role="progressbar" style="width: 0%">0%</div>
      </div>
      <small class="text-muted" id="upload-status-${linkId}">准备上传...</small>
    </div>
  `;
}

// 删除下载链接
function removeDownloadLink(linkId) {
  const linkItem = document.getElementById(`link-item-${linkId}`);
  if (linkItem) {
    linkItem.remove();
  }
}

// 编辑下载项目
async function editDownload(id) {
  try {
    const download = currentDownloads.find(d => d.id === id);
    if (!download) {
      throw new Error('下载项目不存在');
    }
    
    console.log('开始编辑下载项目，ID:', id);
    console.log('下载项目数据:', download);
    
    showDownloadModal(download);
  } catch (error) {
    console.error('编辑下载项目错误:', error);
    showErrorMessage('加载下载项目失败');
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
    
    const downloadId = document.getElementById('download-id').value;
    const token = localStorage.getItem('token');
    
    // 收集基本信息
    const title = document.getElementById('download-title').value.trim();
    const category = document.getElementById('download-category').value;
    const pageId = document.getElementById('download-page-id').value.trim();
    const version = document.getElementById('download-version').value.trim();
    const fileCount = document.getElementById('download-file-count').value;
    const lastUpdate = document.getElementById('download-last-update').value;
    const status = document.getElementById('download-status').value;
    const imageUrl = document.getElementById('download-image-url').value.trim();
    const description = document.getElementById('download-description').value.trim();
    
    // 验证必填字段
    if (!title) {
      throw new Error('请输入标题');
    }
    if (!pageId) {
      throw new Error('请输入页面ID');
    }
    
    // 收集排序ID（新增）
    const sortOrder = document.getElementById('download-sort-order') ? document.getElementById('download-sort-order').value : '0';

    // 收集权限设置
    const accessLevel = document.getElementById('download-access-level').value;
    const specialGroup = document.getElementById('download-special-group').value.trim();
    const requiredPoints = document.getElementById('download-required-points').value;
    
    // 收集下载链接
    const downloadLinks = [];
    const linkItems = document.querySelectorAll('.download-link-item');
    
    console.log('收集到的下载链接项数量:', linkItems.length);
    
    linkItems.forEach((item) => {
      const linkId = item.id.replace('link-item-', '');
      const method = document.getElementById(`link-method-${linkId}`)?.value;
      const name = document.getElementById(`link-name-${linkId}`)?.value || '';
      const url = document.getElementById(`link-url-${linkId}`)?.value || '';
      const password = document.getElementById(`link-password-${linkId}`)?.value || '';
      const fileId = document.getElementById(`link-file-id-${linkId}`)?.value || '';
      
      // 修复：对于直链方式，即使URL为空，只要有fileId就应该收集
      if (method === 'direct' && fileId) {
        const link = {
          method: 'direct',
          name: name || '直链下载',
          url: url || '', // 即使为空也添加
          password: '',
          file_id: parseInt(fileId)
        };
        downloadLinks.push(link);
        console.log('✅ 添加直链:', link);
      } else if (url) {
        // 对于其他方式，必须有URL
        const link = {
          method: method,
          name: name || getDefaultLinkName(method),
          url: url,
          password: password
        };
        
        if (method === 'direct' && fileId) {
          link.file_id = parseInt(fileId);
        }
        
        downloadLinks.push(link);
        console.log('✅ 添加链接:', link);
      } else {
        console.log('⚠️ 跳过空链接:', linkId);
      }

    });
    
    console.log('最终下载链接数组:', downloadLinks);
    
    if (downloadLinks.length === 0) {
      throw new Error('请至少添加一个下载链接');
    }
    
    const data = {
      title,
      category,
      page_id: pageId,
      version: version || null,
      file_count: parseInt(fileCount) || 0,
      last_update: lastUpdate || null,
      is_active: status === '1',
      image_url: imageUrl || null,
      description: description || null,
      access_level: parseInt(accessLevel),
      special_group: specialGroup || null,
      required_points: parseInt(requiredPoints) || 0,
      // 新增：排序ID（数字，默认0）
      sort_order: parseInt(sortOrder) || 0,
      download_links: downloadLinks
    };
    
    console.log('提交数据:', JSON.stringify(data, null, 2));
    
    const url = downloadId 
      ? `${window.API_BASE_URL}/api/admin/downloads/${downloadId}`
      : `${window.API_BASE_URL}/api/admin/downloads`;
    
    const method = downloadId ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    console.log('保存响应状态:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('保存失败，错误数据:', errorData);
      throw new Error(errorData.error || errorData.message || '保存失败');
    }
    
    const result = await response.json();
    console.log('保存结果:', result);
    
    showSuccessMessage(downloadId ? '更新成功' : '创建成功');
    closeDownloadModal();
    
    // 重新加载列表
    await loadDownloads();
    
  } catch (error) {
    console.error('保存下载项目错误:', error);
    showErrorMessage('保存失败: ' + error.message);
  } finally {
    isSaving = false;
  }
}

// 获取默认链接名称
function getDefaultLinkName(method) {
  const names = {
    'baidu': '百度网盘',
    '123pan': '123网盘',
    'onedrive': 'One Drive',
    'direct': '直链下载',
    'other': '其他下载'
  };
  return names[method] || '下载链接';
}

// 删除下载项目
async function deleteDownload(id) {
  if (!confirm('确定要删除这个下载项目吗？此操作不可恢复！')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${window.API_BASE_URL}/api/admin/downloads/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('删除失败');
    }
    
    showSuccessMessage('删除成功');
    loadDownloads();
  } catch (error) {
    console.error('删除下载项目错误:', error);
    showErrorMessage('删除失败');
  }
}

// 关闭模态框
function closeDownloadModal() {
  const modal = document.getElementById('download-modal');
  modal.style.display = 'none';
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

// 显示成功消息
function showSuccessMessage(message) {
  if (typeof window.showSuccessMessage === 'function') {
    window.showSuccessMessage(message);
  } else {
    alert(message);
  }
}

// 显示错误消息
function showErrorMessage(message) {
  if (typeof window.showErrorMessage === 'function') {
    window.showErrorMessage(message);
  } else {
    alert('错误: ' + message);
  }
}