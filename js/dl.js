// downloads.js - 动态加载下载内容

// 初始化下载页面
function initDownloadPage() {
  loadDownloadContent();
}

// 加载下载内容
async function loadDownloadContent() {
  try {
    const token = localStorage.getItem('token');
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch('/api/downloads', {
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error('获取下载内容失败');
    }
    
    const downloads = await response.json();
    renderDownloadContent(downloads);
  } catch (error) {
    console.error('加载下载内容错误:', error);
    showErrorMessage('加载下载内容失败: ' + error.message);
  }
}

// 渲染下载内容
function renderDownloadContent(downloads) {
  // 按分类分组
  const gameDownloads = downloads.filter(d => d.category === 'game');
  const archiveDownloads = downloads.filter(d => d.category === 'archive');
  const otherDownloads = downloads.filter(d => d.category === 'other');
  
  // 渲染游戏下载
  renderDownloadSection('game-downloads', gameDownloads, 'game-last-update');
  
  // 渲染存档下载
  renderDownloadSection('archive-downloads', archiveDownloads, 'archive-last-update');
  
  // 渲染其他资源
  renderDownloadSection('other-downloads', otherDownloads, 'other-last-update');
}

// 渲染下载部分
function renderDownloadSection(containerId, downloads, lastUpdateId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = '';
  
  if (downloads.length === 0) {
    container.innerHTML = '<p>暂无内容</p>';
    return;
  }
  
  // 计算最后更新时间
  const lastUpdate = downloads.reduce((latest, download) => {
    if (!download.last_update) return latest;
    const updateDate = new Date(download.last_update);
    return updateDate > latest ? updateDate : latest;
  }, new Date(0));
  
  // 更新最后更新时间显示
  if (lastUpdate > new Date(0)) {
    document.getElementById(lastUpdateId).textContent = lastUpdate.toLocaleDateString('zh-CN');
  }
  
  // 创建表格
  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr>
        <th>游戏名称</th>
        <th>版本</th>
        <th>文件数</th>
      </tr>
    </thead>
    <tbody>
      ${downloads.map(download => `
        <tr>
          <td><a href="#" data-page="download-detail" data-download-id="${download.page_id}"><i class="fas fa-link me-2"></i> ${download.title}</a></td>
          <td>${download.version || '-'}</td>
          <td>${download.file_count || '0'}</td>
        </tr>
      `).join('')}
    </tbody>
  `;
  
  container.appendChild(table);
  
  // 添加点击事件
  container.querySelectorAll('a[data-page="download-detail"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const downloadId = e.currentTarget.getAttribute('data-download-id');
      loadDownloadDetail(downloadId);
    });
  });
}

// 加载下载详情
async function loadDownloadDetail(downloadId) {
  try {
    const token = localStorage.getItem('token');
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`/api/downloads/${downloadId}`, {
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error('获取下载详情失败');
    }
    
    const download = await response.json();
    renderDownloadDetail(download);
  } catch (error) {
    console.error('加载下载详情错误:', error);
    showErrorMessage('加载下载详情失败: ' + error.message);
  }
}

// 渲染下载详情
function renderDownloadDetail(download) {
  // 切换到下载详情页面
  loadPage('download-detail');
  
  // 设置页面标题
  document.getElementById('detail-title').textContent = download.title;
  
  // 设置最后更新时间
  if (download.last_update) {
    document.getElementById('detail-last-update').textContent = download.last_update;
  }
  
  // 渲染下载信息
  const container = document.getElementById('detail-download-info');
  if (container) {
    container.innerHTML = `
      <tr>
        <th><a href="${download.baidu_url}" target="_blank">百度网盘</a></th>
        <td>${download.file_count || '0'}</td>
        <td>${download.baidu_code || '无'}</td>
        <td>无期限</td>
      </tr>
    `;
  }
}