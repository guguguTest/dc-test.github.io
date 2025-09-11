// toolsDisplay.js - 实用工具展示页面

(function(global) {
  'use strict';

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

    const user = global.currentUser;
    const userRank = user ? (user.user_rank || 0) : 0;
    const userSpecialGroup = user ? (user.rankSp || null) : null;
    const userPoints = user ? (user.points || 0) : 0;

    grid.innerHTML = tools.map(tool => {
      // 检查权限
      const needsLogin = !user && (tool.access_level > 0 || tool.special_group || tool.required_points > 0);
      const lackRank = user && tool.access_level > userRank;
      const lackSpecial = user && tool.special_group && tool.special_group !== userSpecialGroup;
      const lackPoints = user && tool.required_points > userPoints;
      const canAccess = !needsLogin && !lackRank && !lackSpecial && !lackPoints;

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
      if (tool.file_size) {
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
          permText += `特殊组${tool.special_group}`;
        }
        metaTags += `
          <span class="tool-meta-tag meta-permission">
            <i class="fas fa-lock"></i>
            ${permText}
          </span>
        `;
      }

      // 按钮文本和状态
      let buttonText = '使用工具';
      let buttonIcon = 'fas fa-arrow-right';
      let buttonClass = 'tool-action-btn';
      let buttonAction = '';

      if (needsLogin) {
        buttonText = '需要登录';
        buttonIcon = 'fas fa-sign-in-alt';
        buttonClass += ' disabled';
        buttonAction = 'onclick="handleToolLogin()"';
      } else if (lackRank) {
        buttonText = '权限不足';
        buttonIcon = 'fas fa-lock';
        buttonClass += ' disabled';
      } else if (lackSpecial) {
        buttonText = '需要特殊权限';
        buttonIcon = 'fas fa-user-lock';
        buttonClass += ' disabled';
      } else if (lackPoints) {
        buttonText = `需要 ${tool.required_points} 积分`;
        buttonIcon = 'fas fa-coins';
        buttonClass += ' disabled';
      } else {
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

      // 根据类型处理
      if (tool.tool_type === 'page') {
        // 内部页面跳转
        window.location.href = tool.target_url;
      } else {
        // 外部链接新窗口打开
        window.open(tool.target_url, '_blank');
      }

      if (tool.required_points > 0) {
        if (typeof showSuccessMessage === 'function') {
          showSuccessMessage(`已扣除 ${tool.required_points} 积分`);
        }
      }
    } catch (error) {
      console.error('使用工具失败:', error);
      alert('使用工具失败');
    }
  };

  // 处理登录
  window.handleToolLogin = function() {
    if (typeof loadPage === 'function') {
      loadPage('login');
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

})(window);