// toolsDisplay.js - 实用工具展示页面

(function(global) {
  'use strict';

  // 获取当前用户信息
  async function getCurrentUserInfo() {
    const token = localStorage.getItem('token');
    if (!token) {
      global.currentUser = null;
      return;
    }

    try {
      const response = await fetch('https://api.am-all.com.cn/api/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const userData = await response.json();
        global.currentUser = userData;
        console.log('当前用户信息:', userData);
      } else {
        global.currentUser = null;
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      global.currentUser = null;
    }
  }

  // 初始化工具展示页面
  async function initToolsDisplay() {
    const container = document.getElementById('content-container');
    if (!container) return;

    container.innerHTML = `
      <div class="tools-showcase">
        <div class="tools-header">
          <div>
            <h1 class="page-title">实用工具</h1>
            <button class="back-button" data-page="home">
              <i class="fas fa-arrow-left me-2"></i>返回首页
            </button>
          </div>
          <div class="tools-search-container">
            <input type="text" class="tools-search-input" id="tools-search" placeholder="搜索工具...">
            <i class="fas fa-search tools-search-icon"></i>
          </div>
        </div>
        
        <div class="tools-loading" id="tools-loading">
          <div class="tools-spinner"></div>
        </div>
        
        <div class="tools-grid" id="tools-grid" style="display:none;"></div>
        
        <div class="tools-empty-state" id="tools-empty" style="display:none;">
          <div class="tools-empty-icon">
            <i class="fas fa-toolbox"></i>
          </div>
          <p class="tools-empty-text">暂无可用工具</p>
        </div>
      </div>
    `;

    // 先获取当前用户信息
    await getCurrentUserInfo();
    
    // 加载工具
    await loadTools();

    // 设置搜索
    setupSearch();
  }

  // 加载工具列表
  async function loadTools() {
    try {
      const response = await fetch('https://api.am-all.com.cn/api/tools');
      if (!response.ok) throw new Error('加载失败');
      
      const tools = await response.json();
      renderTools(tools);
    } catch (error) {
      console.error('加载工具失败:', error);
      document.getElementById('tools-loading').style.display = 'none';
      document.getElementById('tools-empty').style.display = 'block';
    }
  }

  // 渲染工具卡片
  function renderTools(tools) {
    const grid = document.getElementById('tools-grid');
    const loading = document.getElementById('tools-loading');
    const empty = document.getElementById('tools-empty');
    
    loading.style.display = 'none';
    
    if (!tools || tools.length === 0) {
      empty.style.display = 'block';
      grid.style.display = 'none';
      return;
    }

    // 确保正确获取用户信息
    const user = global.currentUser;
    console.log('渲染工具时的用户信息:', user);
    
    const userRank = user ? (parseInt(user.user_rank) || 0) : 0;
    const userSpecialGroup = user ? (user.rankSp !== undefined ? String(user.rankSp) : null) : null;
    const userPoints = user ? (parseInt(user.points) || 0) : 0;
    
    console.log('用户权限信息:', { userRank, userSpecialGroup, userPoints });

    grid.innerHTML = tools.map(tool => {
      // 检查权限
      const hasPermissionRequirements = tool.access_level > 0 || tool.special_group || tool.required_points > 0;
      const needsLogin = !user && hasPermissionRequirements;

      // 已登录用户的权限检查
      let lackRank = false;
      let lackSpecial = false;
      let lackPoints = false;

      if (user) {
        // 用户组权限检查：用户等级必须 >= 工具要求的最低等级
        lackRank = tool.access_level > 0 && userRank < tool.access_level;
        
        // 特殊用户组检查：必须匹配
        if (tool.special_group) {
          // 管理员(rank >= 5)可以无视特殊组限制
          const isAdmin = userRank >= 5;
          if (!isAdmin) {
            const toolSpecial = String(tool.special_group).trim();
            const userSpecial = userSpecialGroup ? String(userSpecialGroup).trim() : '';
            lackSpecial = toolSpecial !== '' && toolSpecial !== '0' && userSpecial !== toolSpecial;
          }
        }
        
        // 积分检查
        lackPoints = tool.required_points > 0 && userPoints < tool.required_points;
      }

      console.log(`工具 ${tool.title} 权限检查:`, {
        needsLogin,
        lackRank,
        lackSpecial,
        lackPoints,
        toolRequirements: {
          access_level: tool.access_level,
          special_group: tool.special_group,
          required_points: tool.required_points
        }
      });

      // 构建元数据标签
      let metaTags = '';
      if (tool.last_update) {
        metaTags += `
          <span class="tool-meta-tag">
            <i class="fas fa-clock"></i>
            ${new Date(tool.last_update).toLocaleDateString()}
          </span>
        `;
      }
      
      if (tool.tool_type === 'link' && tool.file_size) {
        metaTags += `
          <span class="tool-meta-tag">
            <i class="fas fa-file"></i>
            ${tool.file_size}
          </span>
        `;
      }
      
      if (tool.required_points > 0) {
        metaTags += `
          <span class="tool-meta-tag meta-points">
            <i class="fas fa-coins"></i>
            ${tool.required_points} 积分
          </span>
        `;
      }
      
      if (tool.access_level > 0 || tool.special_group) {
        let permText = '';
        if (tool.access_level > 0) {
          const rankNames = ['普通', '初级', '中级', '高级', '贵宾', '管理员'];
          permText = rankNames[tool.access_level] || `Lv.${tool.access_level}`;
        }
        if (tool.special_group) {
          if (permText) permText += '+';
          const specialText = tool.special_group == 1 ? 'maimoller' : 
                           tool.special_group == 2 ? '协同管理员' : `特殊组${tool.special_group}`;
          permText += specialText;
        }
        metaTags += `
          <span class="tool-meta-tag meta-permission">
            <i class="fas fa-lock"></i>
            ${permText}
          </span>
        `;
      }

      // 按钮文本和状态
      let buttonText, buttonIcon, buttonClass = 'tool-action-btn', buttonAction = '';

      if (needsLogin) {
        buttonText = '需要登录';
        buttonIcon = 'fas fa-sign-in-alt';
        buttonClass += ' disabled';
        buttonAction = 'onclick="handleToolLogin()"';
      } else if (lackRank) {
        const rankNames = ['普通', '初级', '中级', '高级', '贵宾', '管理员'];
        buttonText = `需要${rankNames[tool.access_level]}或以上`;
        buttonIcon = 'fas fa-lock';
        buttonClass += ' disabled';
        buttonAction = `onclick="alert('您的用户组权限不足，需要${rankNames[tool.access_level]}用户组或以上')"`;
      } else if (lackSpecial) {
        const specialText = tool.special_group == 1 ? 'maimoller' : 
                         tool.special_group == 2 ? '协同管理员' : `特殊组${tool.special_group}`;
        buttonText = `需要${specialText}权限`;
        buttonIcon = 'fas fa-user-lock';
        buttonClass += ' disabled';
        buttonAction = `onclick="alert('需要${specialText}特殊用户组权限')"`;
      } else if (lackPoints) {
        buttonText = `需要 ${tool.required_points} 积分`;
        buttonIcon = 'fas fa-coins';
        buttonClass += ' disabled';
        buttonAction = `onclick="alert('积分不足，需要 ${tool.required_points} 积分，您当前有 ${userPoints} 积分')"`;
      } else {
        // 可以使用工具
        if (tool.tool_type === 'link') {
          buttonText = tool.required_points > 0 ? `下载 (-${tool.required_points}积分)` : '下载';
          buttonIcon = 'fas fa-download';
        } else {
          buttonText = tool.required_points > 0 ? `使用工具 (-${tool.required_points}积分)` : '使用工具';
          buttonIcon = 'fas fa-arrow-right';
        }
        buttonAction = `onclick="useTool(${tool.id})"`;
      }

      return `
        <div class="tool-item-card" data-title="${tool.title.toLowerCase()}">
          <div class="tool-item-header">
            <i class="${tool.icon_class || 'fas fa-tools'} tool-item-icon"></i>
            <h3 class="tool-item-title">${tool.title}</h3>
          </div>
          <div class="tool-item-body">
            <p class="tool-item-description">${tool.description || '暂无介绍'}</p>
            ${metaTags ? `<div class="tool-item-meta">${metaTags}</div>` : ''}
            <div class="tool-item-action">
              <button class="${buttonClass}" ${buttonAction}>
                <i class="${buttonIcon}"></i>
                <span>${buttonText}</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    empty.style.display = 'none';
    grid.style.display = 'grid';
  }

  // 创建工具iframe容器
  function createToolIframeContainer(tool) {
    const container = document.getElementById('content-container');
    if (!container) return;
    
    // 保存当前页面内容用于返回
    const previousContent = container.innerHTML;
    
    container.innerHTML = `
      <div class="tool-iframe-container">
        <div class="tool-iframe-header">
          <div class="tool-iframe-info">
            <i class="${tool.icon_class || 'fas fa-tools'} tool-iframe-icon"></i>
            <h2 class="tool-iframe-title">${tool.title}</h2>
          </div>
          <div class="tool-iframe-actions">
            <button class="tool-iframe-refresh-btn" id="tool-iframe-refresh">
              <i class="fas fa-sync-alt"></i>
              <span>刷新</span>
            </button>
            <button class="tool-iframe-back-btn" id="tool-iframe-back">
              <i class="fas fa-arrow-left"></i>
              <span>返回工具列表</span>
            </button>
          </div>
        </div>
        <div class="tool-iframe-wrapper">
          <iframe 
            id="tool-iframe-content"
            src="${tool.target_url}"
            class="tool-iframe-frame"
            frameborder="0"
            allowfullscreen
          ></iframe>
          <div class="tool-iframe-loading" id="tool-iframe-loading">
            <div class="tool-iframe-spinner"></div>
            <p>正在加载工具...</p>
          </div>
        </div>
      </div>
    `;
    
    // 绑定返回按钮事件
    const backBtn = document.getElementById('tool-iframe-back');
    if (backBtn) {
      backBtn.addEventListener('click', function() {
        // 返回到工具列表页面
        if (typeof initToolsDisplay === 'function') {
          initToolsDisplay();
        } else {
          container.innerHTML = previousContent;
        }
      });
    }
    
    // 绑定刷新按钮事件
    const refreshBtn = document.getElementById('tool-iframe-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function() {
        const iframe = document.getElementById('tool-iframe-content');
        if (iframe) {
          iframe.src = iframe.src; // 重新加载iframe
        }
      });
    }
    
    // iframe加载完成后隐藏loading
    const iframe = document.getElementById('tool-iframe-content');
    const loading = document.getElementById('tool-iframe-loading');
    
    if (iframe && loading) {
      iframe.addEventListener('load', function() {
        loading.style.display = 'none';
      });
      
      // 处理iframe加载错误
      iframe.addEventListener('error', function() {
        loading.innerHTML = `
          <div class="tool-iframe-error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>工具加载失败</p>
            <button onclick="document.getElementById('tool-iframe-back').click()">返回</button>
          </div>
        `;
      });
    }
  }

  // 使用工具
window.useTool = async function(toolId) {
  try {
    const token = localStorage.getItem('token');
    
    // 先获取工具信息
    const toolResponse = await fetch(`https://api.am-all.com.cn/api/tools/${toolId}`);
    if (!toolResponse.ok) throw new Error('获取工具信息失败');
    const tool = await toolResponse.json();

    // 如果需要积分，先扣除
    if (tool.required_points > 0 && token) {
      // 确认扣除积分
      if (!confirm(`使用此工具需要消耗 ${tool.required_points} 积分，确定继续吗？`)) {
        return;
      }

      const accessResponse = await fetch(`https://api.am-all.com.cn/api/tools/${toolId}/access`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!accessResponse.ok) {
        const error = await accessResponse.json();
        alert(error.error || '使用失败');
        return;
      }
      
      // 更新用户积分显示
      const result = await accessResponse.json();
      if (global.currentUser && result.new_points !== undefined) {
        global.currentUser.points = result.new_points;
        if (typeof updateUserInfo === 'function') {
          updateUserInfo(global.currentUser);
        }
      }
    }

    // 根据类型处理 - 修改这部分
    if (tool.tool_type === 'page') {
      // 内部页面使用iframe显示
      createToolIframeContainer(tool);
    } else {
      // 外部链接新窗口打开
      window.open(tool.target_url, '_blank');
    }

    if (tool.required_points > 0) {
      if (typeof showSuccessMessage === 'function') {
        showSuccessMessage(`成功使用工具，已扣除 ${tool.required_points} 积分`);
      } else if (tool.tool_type !== 'page') {
        // 只在非页面类型时显示alert（页面类型已经切换了界面）
        alert(`成功使用工具，已扣除 ${tool.required_points} 积分`);
      }
      
      // 如果是外部链接类型，刷新工具列表
      if (tool.tool_type !== 'page') {
        setTimeout(() => {
          getCurrentUserInfo().then(() => loadTools());
        }, 1000);
      }
    }
  } catch (error) {
    console.error('使用工具失败:', error);
    alert('使用工具失败，请稍后重试');
  }
};

  // 处理登录
  window.handleToolLogin = function() {
    if (typeof loadPage === 'function') {
      loadPage('login');
    } else {
      window.location.href = '/login.html';
    }
  };

  // 设置搜索功能
  function setupSearch() {
    const searchInput = document.getElementById('tools-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', function() {
      const query = this.value.toLowerCase();
      const cards = document.querySelectorAll('.tool-item-card');
      
      cards.forEach(card => {
        const title = card.getAttribute('data-title');
        if (title.includes(query)) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }

  // 导出初始化函数
  global.initToolsDisplay = initToolsDisplay;
  global.loadTools = loadTools;

})(window);