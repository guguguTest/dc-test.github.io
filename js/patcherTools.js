// 补丁工具系统主模块
(function() {
  'use strict';
  
  const API_BASE = 'https://api.am-all.com.cn';
  
  // 渲染一级页面（工具分类选择）
  window.renderPatcherCategories = async function() {
    const container = document.getElementById('content-container');
    if (!container) return;
    
    container.innerHTML = `
      <div class="patcher-page">
        <div class="patcher-header">
          <h1 class="page-title">
            <i class="fas fa-plug me-2"></i>
            补丁工具
          </h1>
          <p class="page-description">选择游戏类型查看可用的补丁工具</p>
        </div>
        
        <div class="patcher-categories-loading">
          <div class="spinner-border text-primary"></div>
          <p>加载中...</p>
        </div>
        
        <div class="patcher-categories-container" style="display: none;"></div>
      </div>
    `;
    
    try {
      const response = await fetch(`${API_BASE}/api/patcher-tools/categories`);
      const data = await response.json();
      
      if (data.success && data.categories) {
        renderCategories(data.categories);
      } else {
        throw new Error('加载分类失败');
      }
    } catch (error) {
      console.error('加载工具分类失败:', error);
      container.querySelector('.patcher-categories-loading').innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>加载失败</h3>
          <p>${error.message}</p>
        </div>
      `;
    }
  };
  
  function renderCategories(categories) {
    const container = document.querySelector('.patcher-categories-container');
    const loading = document.querySelector('.patcher-categories-loading');
    
    if (!container) return;
    
    container.innerHTML = `
      <div class="patcher-categories-grid">
        ${categories.map(cat => `
          <div class="patcher-category-card" data-category="${cat.id}">
            <div class="category-card-image">
              <img src="${cat.coverImage}" alt="${cat.name}">
              <div class="category-card-overlay">
                <i class="${cat.icon}"></i>
              </div>
            </div>
            <div class="category-card-content">
              <h3 class="category-card-title">${cat.name}</h3>
              <p class="category-card-description">${cat.description}</p>
              <button class="btn-category-enter">
                <i class="fas fa-arrow-right me-2"></i>
                进入
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
    loading.style.display = 'none';
    container.style.display = 'block';
    
    // 绑定点击事件
    container.querySelectorAll('.patcher-category-card').forEach(card => {
      card.addEventListener('click', function() {
        const category = this.dataset.category;
        renderPatcherTools(category);
      });
    });
  }
  
  // 渲染二级页面（具体工具列表）
  window.renderPatcherTools = async function(category) {
    const container = document.getElementById('content-container');
    if (!container) return;
    
    const categoryNames = {
      'chunithm': 'CHUNITHM 补丁工具',
      'bemani': 'BEMANI 补丁工具'
    };
    
    container.innerHTML = `
      <div class="patcher-page">
        <div class="patcher-header">
          <button class="back-button" onclick="renderPatcherCategories()">
            <i class="fas fa-arrow-left me-2"></i>
            返回
          </button>
          <h1 class="page-title">
            <i class="fas fa-gamepad me-2"></i>
            ${categoryNames[category] || '补丁工具'}
          </h1>
          <p class="page-description">选择需要的补丁工具</p>
        </div>
        
        <div class="patcher-tools-loading">
          <div class="spinner-border text-primary"></div>
          <p>加载中...</p>
        </div>
        
        <div class="patcher-tools-container" style="display: none;"></div>
      </div>
    `;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('请先登录');
      }
      
      const response = await fetch(`${API_BASE}/api/patcher-tools/${category}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('登录已过期，请重新登录');
        }
        throw new Error('加载工具列表失败');
      }
      
      const data = await response.json();
      
      if (data.success && data.tools) {
        renderTools(data.tools, category);
      } else {
        throw new Error('加载工具列表失败');
      }
    } catch (error) {
      console.error('加载工具列表失败:', error);
      container.querySelector('.patcher-tools-loading').innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>加载失败</h3>
          <p>${error.message}</p>
          <button class="btn btn-primary mt-3" onclick="renderPatcherCategories()">
            <i class="fas fa-arrow-left me-2"></i>
            返回分类选择
          </button>
        </div>
      `;
    }
  };
  
  function renderTools(tools, category) {
    const container = document.querySelector('.patcher-tools-container');
    const loading = document.querySelector('.patcher-tools-loading');
    
    if (!container) return;
    
    if (tools.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <h3>暂无可用工具</h3>
          <p>该分类下暂时没有可用的补丁工具</p>
          <button class="btn btn-primary mt-3" onclick="renderPatcherCategories()">
            <i class="fas fa-arrow-left me-2"></i>
            返回分类选择
          </button>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="patcher-tools-grid">
          ${tools.map(tool => `
            <div class="patcher-tool-card" data-tool-id="${tool.id}">
              <div class="tool-card-image">
                <img src="${tool.cover_image || 'https://oss.am-all.com.cn/asset/img/main/default-tool.png'}" alt="${tool.tool_name}">
              </div>
              <div class="tool-card-divider"></div>
              <div class="tool-card-title">${tool.tool_name}</div>
            </div>
          `).join('')}
        </div>
      `;
      
      // 绑定点击事件
      container.querySelectorAll('.patcher-tool-card').forEach(card => {
        card.addEventListener('click', function() {
          const toolId = this.dataset.toolId;
          renderPatcherToolDetail(toolId, category);
        });
      });
    }
    
    loading.style.display = 'none';
    container.style.display = 'block';
  }
  
  // 渲染三级页面（具体工具iframe页面）
  async function renderPatcherToolDetail(toolId, category) {
    const container = document.getElementById('content-container');
    if (!container) return;
    
    container.innerHTML = `
      <div class="patcher-page">
        <div class="patcher-detail-loading">
          <div class="spinner-border text-primary"></div>
          <p>加载中...</p>
        </div>
      </div>
    `;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('请先登录');
      }
      
      const response = await fetch(`${API_BASE}/api/patcher-tools/tool/${toolId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('登录已过期，请重新登录');
        } else if (response.status === 403) {
          throw new Error('权限不足，无法访问此工具');
        }
        throw new Error('加载工具失败');
      }
      
      const data = await response.json();
      
      if (data.success && data.tool) {
        showToolIframe(data.tool, category);
      } else {
        throw new Error('加载工具失败');
      }
    } catch (error) {
      console.error('加载工具详情失败:', error);
      container.innerHTML = `
        <div class="patcher-page">
          <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>加载失败</h3>
            <p>${error.message}</p>
            <button class="btn btn-primary mt-3" onclick="renderPatcherTools('${category}')">
              <i class="fas fa-arrow-left me-2"></i>
              返回工具列表
            </button>
          </div>
        </div>
      `;
    }
  }
  
  function showToolIframe(tool, category) {
    const container = document.getElementById('content-container');
    if (!container) return;
    
    container.innerHTML = `
      <div class="patcher-page patcher-iframe-page">
        <div class="patcher-iframe-header">
          <button class="back-button" onclick="renderPatcherTools('${category}')">
            <i class="fas fa-arrow-left me-2"></i>
            返回
          </button>
          <h1 class="page-title">${tool.tool_name}</h1>
        </div>
        
        <div class="patcher-iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载工具...</p>
          </div>
          <iframe 
            src="${tool.tool_path}" 
            frameborder="0"
            class="patcher-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer class="patcher-footer">
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `;
  }
  
  // 全局暴露函数
  window.renderPatcherCategories = renderPatcherCategories;
  window.renderPatcherTools = renderPatcherTools;
  
})();
