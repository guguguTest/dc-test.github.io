// downloads.js - 动态加载下载内容
if (typeof window.API_BASE_URL === 'undefined') {
    window.API_BASE_URL = 'https://api.am-all.com.cn';
}

// 初始化下载页面
function initDownloadPage() {
  loadDownloadContent();
}

// 加载下载内容
async function loadDownloadContent() {
  try {
    console.log('开始加载下载内容...');
    const token = localStorage.getItem('token');
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${window.API_BASE_URL}/api/downloads`, {
      headers: headers
    });
    
    console.log('下载内容响应状态:', response.status);
    
    if (!response.ok) {
      throw new Error(`获取下载内容失败: ${response.status} ${response.statusText}`);
    }
    
    const downloads = await response.json();
    console.log('下载内容数据:', downloads);
    
    renderDownloadContent(downloads);
  } catch (error) {
    console.error('加载下载内容错误:', error);
    showErrorMessage('加载下载内容失败: ' + error.message);
  }
}

// 渲染下载内容
function renderDownloadContent(downloads) {
  console.log('开始渲染下载内容，数量:', downloads.length);
  
  // 按分类分组
  const gameDownloads = downloads.filter(d => d.category === 'game');
  const archiveDownloads = downloads.filter(d => d.category === 'archive');
  const otherDownloads = downloads.filter(d => d.category === 'other');
  
  console.log('游戏下载:', gameDownloads.length, '存档下载:', archiveDownloads.length, '其他:', otherDownloads.length);
  
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
  if (!container) {
    console.error('容器不存在:', containerId);
    return;
  }
  
  container.innerHTML = '';
  
  if (downloads.length === 0) {
    container.innerHTML = '<p>暂无内容</p>';
    console.log('没有内容用于:', containerId);
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
    const lastUpdateElement = document.getElementById(lastUpdateId);
    if (lastUpdateElement) {
      lastUpdateElement.textContent = lastUpdate.toLocaleDateString('zh-CN');
    }
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
          <td><a href="#" data-page="download-detail" data-download-id="${download.id}"><i class="fas fa-link me-2"></i> ${download.title}</a></td>
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
  
  console.log('渲染完成:', containerId, '项目数:', downloads.length);
}

// 加载下载详情
async function loadDownloadDetail(downloadId) {
  try {
    console.log('加载下载详情:', downloadId);
    const token = localStorage.getItem('token');
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${window.API_BASE_URL}/api/downloads/${downloadId}`, {
      headers: headers
    });
    
    console.log('下载详情响应状态:', response.status);
    
    if (!response.ok) {
      throw new Error('获取下载详情失败');
    }
    
    const download = await response.json();
    console.log('下载详情数据:', download);
    
    // 先加载页面，等待页面渲染完成后再填充内容
    loadPage('download-detail');
    
    // 使用 setTimeout 确保 DOM 元素已经渲染
    setTimeout(() => {
      renderDownloadDetail(download);
    }, 100);
  } catch (error) {
    console.error('加载下载详情错误:', error);
    showErrorMessage('加载下载详情失败: ' + error.message);
  }
}

// 渲染下载详情
function renderDownloadDetail(download, retryCount = 0) {
  console.log('渲染下载详情:', download.title);
  
  // 获取页面元素
  const detailTitle = document.getElementById('detail-title');
  const detailLastUpdate = document.getElementById('detail-last-update');
  const container = document.getElementById('detail-download-info');
  
  // 检查元素是否存在
  if (!detailTitle || !detailLastUpdate || !container) {
    console.error('必要的DOM元素未找到，尝试重试', retryCount);
    
    if (retryCount < 5) {
      // 稍后重试
      setTimeout(() => {
        renderDownloadDetail(download, retryCount + 1);
      }, 100 * (retryCount + 1));
    } else {
      console.error('无法找到必要的DOM元素，请检查页面结构');
    }
    return;
  }
  
  // 设置页面标题
  detailTitle.textContent = download.title;
  
  // 设置最后更新时间
  if (download.last_update) {
    // 格式化日期显示
    const date = new Date(download.last_update);
    detailLastUpdate.textContent = date.toLocaleDateString('zh-CN');
  }
  
  // 渲染下载信息
  container.innerHTML = `
    <tr>
      <th><a href="${download.baidu_url}" target="_blank">百度网盘</a></th>
      <td>${download.file_count || '0'}</td>
      <td>${download.baidu_code || '无'}</td>
      <td>无期限</td>
    </tr>
  `;
}