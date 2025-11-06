// downloads.js - 动态加载下载内容（v3.1 最终修复版 - Token清理 + Blob下载）
if (typeof window.API_BASE_URL === 'undefined') {
    window.API_BASE_URL = 'https://api.am-all.com.cn';
}

const SPECIAL_GROUP_MAP = {
  'maimoller': 1,
  'coadmin': 2,  // 协同管理员
  // 可以添加其他特殊用户组映射
};

// ========== 初始化下载页面 ==========
function initDownloadPage() {
  console.log('🔄 初始化下载页面...');
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('⚠️ 用户未登录');
    if (typeof showLoginRequired==='function') { showLoginRequired('download'); }
    else { console.warn('[download] login required'); }
    return;
  }
  (async () => {
    try {
      const base = (window.API_BASE_URL || window.API_ORIGIN || '').replace(/\/+$/,'') || '';
      const resp = await fetch(base + '/api/check-permission?page=download', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!resp.ok) { 
        console.warn('[download] check-permission HTTP', resp.status); 
        showPermissionDenied && showPermissionDenied(); 
        return; 
      }
      const data = await resp.json();
      if (!data || !data.hasAccess) { 
        showPermissionDenied && showPermissionDenied(); 
        return; 
      }
      console.log('✅ 权限检查通过');
      if (typeof loadDownloadContent === 'function') loadDownloadContent();
      else if (typeof renderDownloadPage === 'function') renderDownloadPage();
    } catch (e) {
      console.warn('[download] check-permission error', e);
      showPermissionDenied && showPermissionDenied();
    }
  })();
}

// 显示权限不足提示
function showPermissionDenied() {
  const contentContainer = document.getElementById('content-container');
  if (!contentContainer) return;
  
  contentContainer.innerHTML = `
    <div class="section">
      <div class="login-required-container">
        <div class="login-required-icon">
          <i class="fas fa-ban"></i>
        </div>
        <h2>权限不足</h2>
        <p>您的用户组级别无法访问下载页面</p>
        <button class="login-btn" data-page="home">
          <i class="fas fa-home me-2"></i>
          返回首页
        </button>
      </div>
    </div>
  `;
  
  const backBtn = contentContainer.querySelector('.login-btn');
  if (backBtn) {
    backBtn.addEventListener('click', function(e) {
      e.preventDefault();
      loadPage('home');
    });
  }
}

async function loadDownloadContent() {
  try {
    console.log('📥 开始加载下载内容...');
    const token = localStorage.getItem('token');
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${window.API_BASE_URL}/api/downloads?t=${Date.now()}`, {
      headers: headers,
      cache: 'no-cache'
    });
    
    console.log('📡 下载内容响应状态:', response.status);
    
    // 调试输出
    console.log('API响应详情:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      headers: Object.fromEntries([...response.headers])
    });
    
    if (response.status === 401) {
      // Token 无效或过期
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      showLoginRequired('download');
      return;
    }
    
    if (!response.ok) {
      throw new Error(`获取下载内容失败: ${response.status} ${response.statusText}`);
    }
    
    const downloads = await response.json();
    console.log('✅ 下载内容数据:', downloads.length, '个项目');
    
    renderDownloadContent(downloads);
  } catch (error) {
    console.error('❌ 加载下载内容错误:', error);
    showErrorMessage('加载下载内容失败: ' + error.message);
    
    // 即使出错也显示空内容，而不是空白页面
    renderDownloadContent([]);
  }
}

// 渲染下载内容
function renderDownloadContent(downloads) {
  console.log('🎨 开始渲染下载内容，数量:', downloads.length);
  
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
    console.error('❌ 容器不存在:', containerId);
    return;
  }
  
  container.innerHTML = '';
  
  if (downloads.length === 0) {
    container.innerHTML = '<p>暂无内容</p>';
    console.log('ℹ️ 没有内容用于:', containerId);
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
  table.className = 'download-table'; // 添加新样式类
  
  // 获取用户信息
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const userRank = userInfo.user_rank || 0;
  const userSpecialGroup = userInfo.rankSp || 0;
  
  table.innerHTML = `
    <thead>
      <tr>
        <th>游戏名称</th>
        <th>版本</th>
        <th>文件数</th>
        <th>访问权限</th>
        <th>特殊访问权限</th>
        <th>所需积分</th>
      </tr>
    </thead>
    <tbody>
      ${downloads.map(download => {
        // 权限检查逻辑
        let hasAccess = true;
        
        // 检查基础用户组权限（-1表示不限制）
        if (download.access_level !== undefined && download.access_level !== null && download.access_level >= 0) {
          hasAccess = userRank >= download.access_level;
        }
        
        // 如果有特殊用户组要求，需额外检查
        if (download.special_group && download.special_group !== '') {
          // 将数据库中的字符串映射为数字，然后与用户的 rankSp 比较
          const requiredSpecialGroup = SPECIAL_GROUP_MAP[download.special_group] || 0;
          hasAccess = hasAccess && (userSpecialGroup === requiredSpecialGroup);
          
          // 调试输出
          console.log('特殊用户组权限检查:', {
            title: download.title,
            userRank,
            accessLevel: download.access_level,
            userSpecialGroup,
            downloadSpecialGroup: download.special_group,
            requiredSpecialGroup,
            hasAccess
          });
        }
        
        const accessLevelNames = {
          '-1': '不限',
          '0': '普通用户',
          '1': '初级用户',
          '2': '中级用户',
          '3': '高级用户',
          '4': '贵宾用户',
          '5': '系统管理员'
        };
        
        const specialGroupNames = {
          'maimoller': 'maimoller',
          'coadmin': '协同管理员'
        };
        
        return `
          <tr>
            <td data-label="游戏名称">
              ${hasAccess ? 
                `<a href="#" class="download-detail-link" data-download-id="${download.id}">
                  <i class="fas fa-link me-2"></i> ${download.title}
                </a>` : 
                `<span class="text-muted">
                  <i class="fas fa-lock me-2"></i> ${download.title}
                </span>`
              }
            </td>
            <td data-label="版本">${download.version || '-'}</td>
            <td data-label="文件数">${download.file_count || '0'}</td>
            <td data-label="访问权限">
              <span class="access-badge rank-${download.access_level === -1 ? 'unlimited' : (download.access_level || 0)}">
                ${accessLevelNames[download.access_level] || accessLevelNames['0']}
              </span>
            </td>
            <td data-label="特殊访问权限">
              ${download.special_group ? 
                `<span class="special-access-badge special-${download.special_group}">
                  ${specialGroupNames[download.special_group] || download.special_group}
                </span>` : 
                '<span class="text-muted">无</span>'
              }
            </td>
            <td data-label="所需积分">
              ${download.required_points > 0 ? 
                `<span class="points-cost">${download.required_points}</span>` : 
                '<span class="text-muted">免费</span>'
              }
            </td>
          </tr>
        `;
      }).join('')}
    </tbody>
  `;
  
  container.appendChild(table);
  
  // 添加点击事件 - 只对有权限的项目添加
  container.querySelectorAll('a.download-detail-link').forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      const downloadId = e.currentTarget.getAttribute('data-download-id');
      
      // 检查是否需要积分
      const download = downloads.find(d => d.id == downloadId);
      if (download && download.required_points > 0) {
        // 确认是否扣除积分
        if (!confirm(`访问此资源需要 ${download.required_points} 积分，确定要继续吗？`)) {
          return;
        }
        
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${window.API_BASE_URL}/api/downloads/${downloadId}/access`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '访问资源失败');
          }
          
          const result = await response.json();
          
          if (result.success) {
            // 更新用户积分信息
            if (currentUser) {
              currentUser.points = result.new_points;
              updateUserInfo(currentUser);
            }
            
            showSuccessMessage(`已扣除 ${download.required_points} 积分`);
            // 添加短暂延迟确保消息显示
            setTimeout(() => {
              loadDownloadDetail(downloadId);
            }, 1500);
          } else {
            showErrorMessage(result.error || '访问资源失败');
          }
        } catch (error) {
          console.error('访问资源错误:', error);
          showErrorMessage('访问资源失败: ' + error.message);
        }
      } else {
        loadDownloadDetail(downloadId);
      }
    });
  });
}

// 添加辅助函数
function getSpecialGroupDisplayName(specialGroup) {
  const specialGroupMap = {
    '1': 'maimoller',
    '2': '协同管理员',
    // 添加其他特殊用户组映射
  };
  
  return specialGroupMap[specialGroup] || specialGroup;
}

// 加载下载详情
async function loadDownloadDetail(downloadId) {
  try {
    console.log('📄 加载下载详情:', downloadId);
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
    console.log('✅ 下载详情数据:', download);
    
    // 先加载页面，等待页面渲染完成后再填充内容
    loadPage('download-detail');
    
    // 使用 setTimeout 确保 DOM 元素已经渲染
    setTimeout(() => {
      renderDownloadDetail(download);
      
      // 添加返回按钮事件监听
      const backButton = document.querySelector('.back-button[data-page="download"]');
      if (backButton) {
        // 先移除旧的监听器，再添加新的
        backButton.replaceWith(backButton.cloneNode(true));
        document.querySelector('.back-button[data-page="download"]').addEventListener('click', function(e) {
          e.preventDefault();
          loadPage('download');
        });
      }
    }, 100);
  } catch (error) {
    console.error('❌ 加载下载详情错误:', error);
    showErrorMessage('加载下载详情失败: ' + error.message);
  }
}

// 渲染下载详情（v2.1.1 修复版）
function renderDownloadDetail(download, retryCount = 0) {
  console.log('🎨 渲染下载详情:', download.title);
  
  // 获取页面元素
  const detailTitle = document.getElementById('detail-title');
  const detailLastUpdate = document.getElementById('detail-last-update');
  const container = document.getElementById('detail-download-info');
  
  // 检查元素是否存在
  if (!detailTitle || !detailLastUpdate || !container) {
    console.error('❌ 必要的DOM元素未找到，尝试重试', retryCount);
    
    if (retryCount < 5) {
      // 稍后重试
      setTimeout(() => {
        renderDownloadDetail(download, retryCount + 1);
      }, 100 * (retryCount + 1));
    } else {
      console.error('❌ 无法找到必要的DOM元素，请检查页面结构');
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
  
  // 解析下载链接
  let downloadLinks = [];
  try {
    if (download.download_links) {
      downloadLinks = typeof download.download_links === 'string' 
        ? JSON.parse(download.download_links)
        : download.download_links;
    }
  } catch (e) {
    console.error('❌ 解析下载链接失败:', e);
  }
  
  console.log('📦 下载链接数量:', downloadLinks.length);
  
  // 渲染下载链接表格
  container.innerHTML = '';
  
  if (downloadLinks.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="4" class="text-center">暂无下载链接</td>
      </tr>
    `;
  } else {
    downloadLinks.forEach((link, index) => {
      const tr = document.createElement('tr');
      
      // 获取下载方式的显示名称
      const methodNames = {
        'baidu': '百度网盘',
        '123pan': '123网盘',
        'onedrive': 'One Drive',
        'direct': '直链下载',
        'other': '其他下载'
      };
      
      const methodName = methodNames[link.method] || link.name || '下载链接' + (index + 1);
      
      // 判断是否是直链下载
      if (link.method === 'direct') {
        // 直链下载：需要通过API带token
        const fileId = link.file_id || '';
        console.log('🔗 直链下载，文件ID:', fileId);
        tr.innerHTML = `
          <td data-label="下载方式">
            <a href="#" class="direct-download-link" data-file-id="${fileId}">
              <i class="fas fa-download me-2"></i>${methodName}
            </a>
          </td>
          <td data-label="文件数">${download.file_count || '-'}</td>
          <td data-label="提取码/访问密码">无需密码</td>
          <td data-label="资源有效期">无期限</td>
        `;
      } else {
        // 其他方式：直接跳转
        tr.innerHTML = `
          <td data-label="下载方式">
            <a href="${link.url}" target="_blank" class="external-link">
              <i class="fas fa-external-link-alt me-2"></i>${methodName}
            </a>
          </td>
          <td data-label="文件数">${download.file_count || '-'}</td>
          <td data-label="提取码/访问密码">${link.password || '无'}</td>
          <td data-label="资源有效期">无期限</td>
        `;
      }
      container.appendChild(tr);
    });
    
    // 为直链下载添加点击事件
    container.querySelectorAll('.direct-download-link').forEach(link => {
      link.addEventListener('click', handleDirectDownload);
    });
  }
  
  // 移除旧的全局函数，不再需要
  delete window.handleExternalLink;
}

// ========== 直链下载处理函数（v3.1 最终版 - Token清理 + Blob下载）==========
async function handleDirectDownload(e) {
  e.preventDefault();
  
  const button = e.currentTarget;
  const fileId = button.getAttribute('data-file-id');
  
  console.log('🎯 开始直接下载，文件ID:', fileId);
  
  if (!fileId) {
    console.error('❌ 无效的文件ID');
    showErrorMessage('无效的文件ID');
    return;
  }
  
  // 防止重复点击
  if (button.classList.contains('downloading')) {
    console.log('⚠️ 正在下载中，忽略重复点击');
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('❌ 用户未登录');
      showErrorMessage('请先登录');
      setTimeout(() => {
        showLoginRequired('download');
      }, 1500);
      return;
    }
    
    // 显示下载准备中状态
    const originalHTML = button.innerHTML;
    button.classList.add('downloading');
    button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>准备下载...';
    button.style.pointerEvents = 'none';
    
    console.log('📥 步骤1: 请求下载令牌，文件ID:', fileId);
    
    // 第一步：获取下载token
    const tokenResponse = await fetch(`${window.API_BASE_URL}/api/download-files/${fileId}/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 令牌请求响应状态:', tokenResponse.status);
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('❌ 获取令牌失败:', errorData);
      throw new Error(errorData.error || '获取下载令牌失败');
    }
    
    const tokenData = await tokenResponse.json();
    console.log('📦 收到令牌数据');
    
    if (!tokenData.success || !tokenData.downloadUrl) {
      console.error('❌ 令牌数据无效:', tokenData);
      throw new Error('下载令牌无效');
    }
    
    console.log('✅ 步骤2: 下载令牌获取成功');
    console.log('📝 原始下载URL:', tokenData.downloadUrl);
    
    // 更新按钮状态
    button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>下载中...';
    
    // 🔧 清理Token URL中的异常字符
    let cleanDownloadUrl = tokenData.downloadUrl;
    try {
      const url = new URL(cleanDownloadUrl);
      let downloadToken = url.searchParams.get('token');
      
      if (downloadToken) {
        console.log('📝 原始Token:', downloadToken.substring(0, 16) + '...', '长度:', downloadToken.length);
        
        // 移除token末尾的异常字符（如 :1, :2 等）
        if (downloadToken.includes(':')) {
          console.log('⚠️ 检测到Token包含冒号，正在清理...');
          downloadToken = downloadToken.split(':')[0].trim();
          console.log('✅ 清理后Token:', downloadToken.substring(0, 16) + '...', '长度:', downloadToken.length);
        }
        
        // 验证Token长度（应该是64位十六进制）
        if (downloadToken.length !== 64) {
          console.warn('⚠️ Token长度异常:', downloadToken.length, '(正常应该是64位)');
        }
        
        // 更新URL参数
        url.searchParams.set('token', downloadToken);
        cleanDownloadUrl = url.toString();
        console.log('✅ 最终下载URL已清理');
      }
    } catch (error) {
      console.error('❌ URL解析错误:', error);
      console.log('⚠️ 使用原始URL继续');
      // 继续使用原URL
    }
    
    // 第二步：使用Fetch API下载文件（Blob方式，避免页面跳转）
    console.log('📥 步骤3: 开始下载文件...');
    const downloadResponse = await fetch(cleanDownloadUrl);
    
    if (!downloadResponse.ok) {
      let errorMessage = '文件下载失败';
      try {
        const errorData = await downloadResponse.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = `HTTP ${downloadResponse.status}: ${downloadResponse.statusText}`;
      }
      console.error('❌ 下载失败:', errorMessage);
      throw new Error(errorMessage);
    }
    
    // 获取文件名（从Content-Disposition头）
    const contentDisposition = downloadResponse.headers.get('Content-Disposition');
    let filename = 'download';
    
    if (contentDisposition) {
      // 尝试提取UTF-8文件名
      const utf8Match = contentDisposition.match(/filename\*=UTF-8''(.+)/);
      if (utf8Match) {
        filename = decodeURIComponent(utf8Match[1]);
      } else {
        // 尝试提取普通文件名
        const normalMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (normalMatch) {
          filename = normalMatch[1];
        }
      }
    }
    
    console.log('📦 文件名:', filename);
    
    // 将响应转为Blob
    const blob = await downloadResponse.blob();
    console.log('📦 文件大小:', (blob.size / 1024 / 1024).toFixed(2), 'MB');
    
    // 创建Blob URL并触发下载
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    
    console.log('🖱️ 触发下载...');
    a.click();
    
    // 清理Blob URL
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      console.log('🧹 清理完成');
    }, 100);
    
    // 恢复按钮状态
    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.classList.remove('downloading');
      button.style.pointerEvents = '';
      console.log('🔄 按钮状态已恢复');
    }, 1000);
    
    showSuccessMessage('下载已开始，请查看浏览器下载');
    console.log('🎉 下载流程完成');
    
  } catch (error) {
    console.error('❌ 下载错误:', error);
    console.error('❌ 错误信息:', error.message);
    showErrorMessage('下载失败: ' + error.message);
    
    // 恢复按钮状态
    const originalHTML = button.getAttribute('data-original-html') || '<i class="fas fa-download me-2"></i>直链下载';
    button.innerHTML = originalHTML;
    button.classList.remove('downloading');
    button.style.pointerEvents = '';
  }
}

// ========== 确保函数全局可用 ==========
// 将关键函数暴露到 window 对象，确保 spa.js 可以调用
window.initDownloadPage = initDownloadPage;
window.loadDownloadContent = loadDownloadContent;
window.renderDownloadContent = renderDownloadContent;
window.loadDownloadDetail = loadDownloadDetail;
window.handleDirectDownload = handleDirectDownload;

console.log('✅ 下载功能已加载（v3.1 最终修复版 - Token清理 + Blob下载）');
console.log('✅ initDownloadPage 函数已注册到 window 对象');
console.log('ℹ️ handleDirectDownload 已优化：');
console.log('   - 使用Blob下载避免页面导航');
console.log('   - 自动清理Token中的异常字符（:1等）');