// downloads.js - 动态加载下载内容
if (typeof window.API_BASE_URL === 'undefined') {
    window.API_BASE_URL = 'https://api.am-all.com.cn';
}

const SPECIAL_GROUP_MAP = {
  'maimoller': 1,
  // 可以添加其他特殊用户组映射
};

// 初始化下载页面
function initDownloadPage() {
  const token = localStorage.getItem('token');
  if (!token) {
    showLoginRequired('download');
    return;
  }

  // 获取用户信息
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  
  // 调试输出 - 添加在这里
  console.log('用户信息:', {
    userInfo: userInfo,
    userRank: userInfo.user_rank,
    userSpecialGroup: userInfo.rankSp,
    token: localStorage.getItem('token')
  });
  
  // 即使权限不足也加载内容，因为可能有公开内容
  if (userInfo.user_rank <= 0) {
    showPermissionDenied();
  }

  loadDownloadContent();
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
    console.log('开始加载下载内容...');
    const token = localStorage.getItem('token');
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${window.API_BASE_URL}/api/downloads?t=${Date.now()}`, {
      headers: headers,
      cache: 'no-cache'
    });
    
    console.log('下载内容响应状态:', response.status);
    
    // 调试输出 - 添加在这里
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
    console.log('下载内容数据:', downloads);
    
    renderDownloadContent(downloads);
  } catch (error) {
    console.error('加载下载内容错误:', error);
    showErrorMessage('加载下载内容失败: ' + error.message);
    
    // 即使出错也显示空内容，而不是空白页面
    renderDownloadContent([]);
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
      </tr>
    </thead>
    <tbody>
      ${downloads.map(download => {
        // 权限检查逻辑
        let hasAccess = userRank >= (download.access_level || 0);
        
        // 如果有特殊用户组要求，需要额外检查
        if (download.special_group && download.special_group !== '') {
          // 将数据库中的字符串映射为数字，然后与用户的 rankSp 比较
          const requiredSpecialGroup = SPECIAL_GROUP_MAP[download.special_group] || 0;
          hasAccess = hasAccess && (userSpecialGroup === requiredSpecialGroup);
          
          // 调试输出 - 添加在这里
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
        
        // 调试输出 - 添加在这里（普通权限检查）
        console.log('普通权限检查:', {
          title: download.title,
          userRank,
          accessLevel: download.access_level,
          hasAccess: userRank >= (download.access_level || 0)
        });
        
        const accessLevelNames = {
          0: '普通用户',
          1: '初级用户',
          2: '中级用户',
          3: '高级用户',
          4: '贵宾用户',
          5: '系统管理员'
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
              <span class="access-badge rank-${download.access_level || 0}">
                ${accessLevelNames[download.access_level || 0]}
                ${download.special_group ? `<br><small>(${download.special_group})</small>` : ''}
              </span>
              ${download.required_points > 0 ? 
                `<span class="points-cost">(${download.required_points}积分)</span>` : 
                ''
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
    // 添加其他特殊用户组映射
  };
  
  return specialGroupMap[specialGroup] || specialGroup;
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
  
  // 渲染下载信息 - 修复HTML结构
  container.innerHTML = `
    <tr>
      <td data-label="下载方式">
        <a href="${download.baidu_url}" target="_blank" class="external-link">
          <i class="fas fa-external-link-alt me-2"></i>百度网盘
        </a>
      </td>
      <td data-label="文件数">${download.file_count || '0'}</td>
      <td data-label="提取码/访问密码">${download.baidu_code || '无'}</td>
      <td data-label="资源有效期">无期限</td>
    </tr>
  `;
  
  // 移除旧的全局函数，不再需要
  delete window.handleExternalLink;
}